import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod/v4'
import { toast } from 'sonner'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

import api from '@/lib/api'
import { parseBRL, formatBRL } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import type { Receita } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const schema = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
  descricao: z.string().min(1, 'Descrição obrigatória'),
  custo: z.number({ error: 'Custo inválido' }).positive('Custo deve ser positivo'),
  tipo_receita: z.enum(['D', 'S']),
})

type FormValues = {
  nome: string
  descricao: string
  custo: number
  tipo_receita: 'D' | 'S'
}

export default function Receitas() {
  const navigate = useNavigate()
  const { usuario, logout } = useAuthStore()
  const [receitas, setReceitas] = useState<Receita[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterTipo, setFilterTipo] = useState<'all' | 'D' | 'S'>('all')
  const [filterDataInicio, setFilterDataInicio] = useState('')
  const [filterDataFim, setFilterDataFim] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Receita | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Receita | null>(null)
  const [deleting, setDeleting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nome: '', descricao: '', custo: 0, tipo_receita: 'D' },
  })

  const fetchReceitas = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (search) params.nome = search
      if (filterTipo !== 'all') params.tipo_receita = filterTipo
      if (filterDataInicio) params.data_inicio = filterDataInicio
      if (filterDataFim) params.data_fim = filterDataFim
      const { data } = await api.get<Receita[]>('/receitas', { params })
      setReceitas(data)
    } catch {
      toast.error('Erro ao carregar receitas')
    } finally {
      setLoading(false)
    }
  }, [search, filterTipo, filterDataInicio, filterDataFim])

  useEffect(() => {
    void fetchReceitas()
  }, [fetchReceitas])

  function openCreate() {
    setEditTarget(null)
    form.reset({ nome: '', descricao: '', custo: 0, tipo_receita: 'D' })
    setDialogOpen(true)
  }

  function openEdit(r: Receita) {
    setEditTarget(r)
    form.reset({
      nome: r.nome,
      descricao: r.descricao,
      custo: Number(r.custo),
      tipo_receita: r.tipo_receita,
    })
    setDialogOpen(true)
  }

  async function onSubmit(values: FormValues) {
    try {
      if (editTarget) {
        await api.put(`/receitas/${editTarget.id}`, values)
        toast.success('Receita atualizada')
      } else {
        await api.post('/receitas', values)
        toast.success('Receita criada')
      }
      setDialogOpen(false)
      void fetchReceitas()
    } catch {
      toast.error('Erro ao salvar receita')
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/receitas/${deleteTarget.id}`)
      toast.success('Receita excluída')
      setDeleteTarget(null)
      void fetchReceitas()
    } catch {
      toast.error('Erro ao excluir receita')
    } finally {
      setDeleting(false)
    }
  }

  function handleLogout() {
    logout()
    navigate('/')
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('pt-BR')
  }

  function limparFiltros() {
    setSearch('')
    setFilterTipo('all')
    setFilterDataInicio('')
    setFilterDataFim('')
  }

  function exportarPDF() {
    const doc = new jsPDF()

    doc.setFontSize(16)
    doc.text('Relatório de Receitas', 14, 16)

    const filtrosAtivos: string[] = []
    if (search) filtrosAtivos.push(`Nome: "${search}"`)
    if (filterTipo !== 'all') filtrosAtivos.push(`Tipo: ${filterTipo === 'D' ? 'Doce' : 'Salgado'}`)
    if (filterDataInicio) filtrosAtivos.push(`De: ${new Date(filterDataInicio).toLocaleDateString('pt-BR')}`)
    if (filterDataFim) filtrosAtivos.push(`Até: ${new Date(filterDataFim).toLocaleDateString('pt-BR')}`)

    let startY = 24
    if (filtrosAtivos.length > 0) {
      doc.setFontSize(9)
      doc.setTextColor(100)
      doc.text(`Filtros: ${filtrosAtivos.join(' | ')}`, 14, startY)
      startY += 6
      doc.setTextColor(0)
    }

    doc.setFontSize(9)
    doc.text(
      `Gerado em ${new Date().toLocaleString('pt-BR')} — ${receitas.length} registro(s)`,
      14,
      startY,
    )

    autoTable(doc, {
      startY: startY + 4,
      head: [['Nome', 'Descrição', 'Tipo', 'Custo', 'Data']],
      body: receitas.map((r) => [
        r.nome,
        r.descricao.length > 60 ? r.descricao.slice(0, 57) + '...' : r.descricao,
        r.tipo_receita === 'D' ? 'Doce' : 'Salgado',
        formatBRL(Number(r.custo)),
        formatDate(r.data_registro),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 30, 30] },
      columnStyles: {
        0: { cellWidth: 38 },
        1: { cellWidth: 70 },
        2: { cellWidth: 22 },
        3: { cellWidth: 28 },
        4: { cellWidth: 28 },
      },
    })

    doc.save('receitas.pdf')
    toast.success('PDF exportado')
  }

  const temFiltroAtivo =
    search || filterTipo !== 'all' || filterDataInicio || filterDataFim

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Receitas</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{usuario?.nome}</span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Sair
          </Button>
        </div>
      </header>

      <main className="px-6 py-6 max-w-6xl mx-auto space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              <Input
                placeholder="Buscar por nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-xs"
              />
              <Select
                value={filterTipo}
                onValueChange={(v) => setFilterTipo(v as 'all' | 'D' | 'S')}
              >
                <SelectTrigger className="w-36">
                  <SelectValue>
                    {{ all: 'Todos os tipos', D: 'Doce', S: 'Salgado' }[filterTipo]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="D">Doce</SelectItem>
                  <SelectItem value="S">Salgado</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-1">
                <Input
                  type="date"
                  aria-label="Data início"
                  value={filterDataInicio}
                  onChange={(e) => setFilterDataInicio(e.target.value)}
                  className="w-40"
                />
                <span className="text-muted-foreground text-sm">até</span>
                <Input
                  type="date"
                  aria-label="Data fim"
                  value={filterDataFim}
                  onChange={(e) => setFilterDataFim(e.target.value)}
                  className="w-40"
                />
              </div>

              {temFiltroAtivo && (
                <Button variant="ghost" size="sm" onClick={limparFiltros}>
                  Limpar filtros
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={exportarPDF} disabled={receitas.length === 0}>
                Exportar PDF
              </Button>
              <Button onClick={openCreate}>Nova receita</Button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Custo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : receitas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                    Nenhuma receita encontrada
                  </TableCell>
                </TableRow>
              ) : (
                receitas.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.nome}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {r.descricao}
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.tipo_receita === 'D' ? 'secondary' : 'outline'}>
                        {r.tipo_receita === 'D' ? 'Doce' : 'Salgado'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatBRL(Number(r.custo))}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(r.data_registro)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(r)}
                        >
                          Excluir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? 'Editar receita' : 'Nova receita'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Bolo de chocolate" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input placeholder="Descreva a receita" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="custo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custo</FormLabel>
                      <FormControl>
                        <Input
                          inputMode="numeric"
                          placeholder="R$ 0,00"
                          value={field.value ? formatBRL(field.value) : ''}
                          onChange={(e) => {
                            field.onChange(parseBRL(e.target.value))
                          }}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tipo_receita"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue>
                              { field.value ? { D: 'Doce', S: 'Salgado' }[field.value] : 'Selecione' }
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="D">Doce</SelectItem>
                          <SelectItem value="S">Salgado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Salvando...' : 'Salvar'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir{' '}
            <span className="text-foreground font-medium">{deleteTarget?.nome}</span>?
            Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
