import React, { useEffect, useState } from 'react';
import { rtdb } from '../firebase';
import {
  ref,
  push,
  onValue,
  update,
  runTransaction
} from 'firebase/database';

/* Data model (collection: goals)
  {
    id: string (doc id)
    team: string
    title: string
    target: number (meta final)
    current: number (progresso)
    updatedAt: timestamp
    createdAt: timestamp
  }
*/

const initialForm = { team: '', title: '', target: '' };

export default function GoalManager() {
  const [form, setForm] = useState(initialForm);
  const [goals, setGoals] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const goalsRef = ref(rtdb, 'goals');
    const unsubscribe = onValue(goalsRef, snapshot => {
      const val = snapshot.val() || {};
      const list = Object.entries(val).map(([id, data]) => ({ id, ...data })).sort((a,b)=> (b.createdAt||0) - (a.createdAt||0));
      setGoals(list);
      setLoading(false);
    }, err => {
      setError(err.message);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const reset = () => { setForm(initialForm); setEditingId(null); };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.team || !form.title || !form.target) return;
    try {
      if (editingId) {
        await update(ref(rtdb, `goals/${editingId}`), {
          team: form.team,
          title: form.title,
          target: Number(form.target),
          updatedAt: Date.now()
        });
      } else {
        await push(ref(rtdb, 'goals'), {
          team: form.team,
          title: form.title,
          target: Number(form.target),
          current: 0,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      }
      reset();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = goal => {
    setEditingId(goal.id);
    setForm({ team: goal.team, title: goal.title, target: goal.target });
  };

  const incrementProgress = async (id, amount) => {
    try {
      const currentRef = ref(rtdb, `goals/${id}/current`);
      await runTransaction(currentRef, current => {
        return (current || 0) + amount;
      });
      await update(ref(rtdb, `goals/${id}`), { updatedAt: Date.now() });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="goal-manager">
      <h1>Metas das Equipes</h1>
      <form onSubmit={handleSubmit} className="goal-form">
        <div>
          <label>Equipe<br />
            <input name="team" value={form.team} onChange={handleChange} placeholder="Nome da equipe" />
          </label>
        </div>
        <div>
          <label>Título da Meta<br />
            <input name="title" value={form.title} onChange={handleChange} placeholder="Descrição" />
          </label>
        </div>
        <div>
          <label>Meta Final<br />
            <input name="target" type="number" value={form.target} onChange={handleChange} placeholder="100" />
          </label>
        </div>
        <button type="submit">{editingId ? 'Salvar Alterações' : 'Adicionar Meta'}</button>
        {editingId && <button type="button" onClick={reset}>Cancelar</button>}
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {loading ? <p>Carregando...</p> : (
        <table className="goal-table">
          <thead>
            <tr>
              <th>Equipe</th>
              <th>Meta</th>
              <th>Progresso</th>
              <th>%</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {goals.map(g => {
              const pct = g.target ? Math.min(100, Math.round((g.current || 0) / g.target * 100)) : 0;
              return (
                <tr key={g.id} className={pct >= 100 ? 'complete' : ''}>
                  <td>{g.team}</td>
                  <td>{g.title} ({g.target})</td>
                  <td>
                    <strong>{g.current || 0}</strong>
                    <div className="progress-bar">
                      <div className="fill" style={{width: pct + '%'}} />
                    </div>
                  </td>
                  <td>{pct}%</td>
                  <td>
                    <button onClick={() => startEdit(g)}>Editar</button>
                    <div className="increment-buttons">
                      {[1,5,10].map(a => <button key={a} type="button" onClick={() => incrementProgress(g.id, a)}>+{a}</button>)}
                    </div>
                  </td>
                </tr>
              );
            })}
            {goals.length === 0 && (
              <tr><td colSpan="5">Nenhuma meta cadastrada.</td></tr>
            )}
          </tbody>
        </table>
      )}
  <p style={{marginTop: 24, fontSize: 12, opacity: 0.6}}>Atualização em tempo real via Realtime Database. Integre o Power BI via exportação BigQuery ou REST.</p>
    </div>
  );
}
