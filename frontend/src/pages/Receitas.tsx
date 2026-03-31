import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod/v4'
import { toast } from 'sonner'

import api from '@/lib/api'
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
  custo: z.preprocess(
    (v) => (v === '' ? undefined : Number(v)),
    z.number({ error: 'Custo inválido' }).positive('Custo deve ser positivo')
  ),
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
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Receita | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Receita | null>(null)
  const [deleting, setDeleting] = useState(false)

  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: { nome: '', descricao: '', custo: 0, tipo_receita: 'D' },
  })

  async function fetchReceitas() {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (search) params.nome = search
      if (filterTipo !== 'all') params.tipo_receita = filterTipo
      const { data } = await api.get<Receita[]>('/receitas', { params })
      setReceitas(data)
    } catch {
      toast.error('Erro ao carregar receitas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchReceitas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterTipo])

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

  function formatCurrency(value: number | string) {
    return Number(value).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('pt-BR')
  }

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
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-1">
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
                  {{ all: 'Todos', D: 'Doce', S: 'Salgado' }[filterTipo]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="D">Doce</SelectItem>
                <SelectItem value="S">Salgado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={openCreate}>Nova receita</Button>
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
                    <TableCell>{formatCurrency(r.custo)}</TableCell>
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
            <form onSubmit={form.handleSubmit(onSubmit as Parameters<typeof form.handleSubmit>[0])} className="space-y-4">
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
                      <FormLabel>Custo (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value)}
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
