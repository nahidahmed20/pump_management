import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Building2, Pencil, Plus, Trash2 } from 'lucide-react';

export default function BranchIndex({ branches }) {
    const [editing, setEditing] = useState(null);
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '', code: '', phone: '', address: '', is_active: true,
    });

    const edit = (branch) => {
        setEditing(branch);
        setData({ name: branch.name, code: branch.code, phone: branch.phone || '', address: branch.address || '', is_active: !!branch.is_active });
    };
    const cancel = () => { setEditing(null); reset(); };
    const submit = (e) => {
        e.preventDefault();
        const options = { preserveScroll: true, onSuccess: cancel };
        editing ? put(`/admin/branches/${editing.id}`, options) : post('/admin/branches', options);
    };

    return <AdminLayout title="Branch Management" icon={Building2}>
        <Head title="Branches | FuelDesk" />
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
            <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm h-fit">
                <h2 className="mb-5 flex items-center gap-2 text-lg font-bold"><Plus size={19} /> {editing ? 'Edit Branch' : 'New Branch'}</h2>
                {[['name','Branch name'],['code','Unique code'],['phone','Phone']].map(([key,label]) => <label key={key} className="mb-4 block text-sm font-semibold text-slate-700">{label}<input value={data[key]} onChange={e => setData(key, key === 'code' ? e.target.value.toUpperCase() : e.target.value)} className="mt-1.5 w-full rounded-lg border-slate-200" />{errors[key] && <span className="block mt-1 text-xs text-red-600">{errors[key]}</span>}</label>)}
                <label className="mb-4 block text-sm font-semibold text-slate-700">Address<textarea value={data.address} onChange={e => setData('address', e.target.value)} className="mt-1.5 w-full rounded-lg border-slate-200" /></label>
                <label className="mb-5 flex items-center gap-2 text-sm"><input type="checkbox" checked={data.is_active} onChange={e => setData('is_active', e.target.checked)} /> Active</label>
                <div className="flex gap-2"><button disabled={processing} className="rounded-lg bg-amber-500 px-4 py-2 font-semibold">{editing ? 'Update' : 'Create'}</button>{editing && <button type="button" onClick={cancel} className="rounded-lg border px-4 py-2">Cancel</button>}</div>
            </form>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left text-sm"><thead className="bg-slate-50"><tr><th className="p-4">Branch</th><th className="p-4">Users</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></tr></thead><tbody className="divide-y">{branches.data.map(branch => <tr key={branch.id}><td className="p-4"><div className="font-bold">{branch.name}</div><div className="text-xs text-slate-500">{branch.code}</div></td><td className="p-4">{branch.users_count}</td><td className="p-4">{branch.is_active ? 'Active' : 'Inactive'}</td><td className="p-4 text-right"><button onClick={() => edit(branch)} className="mr-2 rounded p-2 text-blue-600"><Pencil size={17}/></button><button onClick={() => confirm('Delete this branch?') && router.delete(`/admin/branches/${branch.id}`)} className="rounded p-2 text-red-600"><Trash2 size={17}/></button></td></tr>)}</tbody></table>
            </div>
        </div>
    </AdminLayout>;
}
