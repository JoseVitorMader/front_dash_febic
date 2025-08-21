import React, { useEffect, useMemo, useState } from 'react';
import { rtdb } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList, Cell,
  RadialBarChart, RadialBar, Legend, PieChart, Pie
} from 'recharts';
import '../App.css';


export default function Dashboard() {
  const [goals, setGoals] = useState([]);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const goalsRef = ref(rtdb, 'goals');
    const unsub = onValue(goalsRef, snap => {
      const val = snap.val() || {};
      const list = Object.entries(val).map(([id, data]) => ({ id, ...data }));
      list.sort((a,b)=> a.team.localeCompare(b.team));
      setGoals(list);
    });
    return () => unsub();
  }, []);

  const total = useMemo(() => {
    const targetSum = goals.reduce((s,g)=> s + (g.target||0),0);
    const currentSum = goals.reduce((s,g)=> s + (g.current||0),0);
    const pct = targetSum ? Math.min(100, (currentSum/targetSum)*100) : 0;
    return { targetSum, currentSum, pct };
  }, [goals]);

  const pageSize = 3;
  const pages = Math.ceil(goals.length / pageSize) || 1;
  const pageGoals = goals.slice(page*pageSize, page*pageSize+pageSize);

  const barData = pageGoals.map(g => ({
    name: g.team || g.title,
    Meta: g.target || 0,
    Atual: g.current || 0,
    Percent: g.target ? Math.round((g.current||0)/g.target*100) : 0,
    color: g.color || '#1e90ff'
  }));

  const radialData = pageGoals.map(g => ({
    name: g.team,
    uv: g.target ? Math.min(100, Math.round((g.current||0)/g.target*100)) : 0,
    fill: g.color || '#1e90ff'
  }));

  const next = () => setPage(p => (p+1) % pages);
  const prev = () => setPage(p => (p-1+pages) % pages);

  const stackedData = pageGoals.map(g => ({
    name: g.team,
    Atual: g.current || 0,
    Restante: Math.max(0, (g.target||0) - (g.current||0)),
    color: g.color || '#1e90ff'
  }));
  const teamShareData = goals.filter(g => (g.current||0) > 0).map(g => ({ name: g.team, value: g.current||0, color: g.color || '#1e90ff' }));
  const overallDistribution = [
    { name: 'Atual', value: total.currentSum, color: '#1e90ff' },
    { name: 'Restante', value: Math.max(0, total.targetSum - total.currentSum), color: '#375574' }
  ];

  return (
    <div className="App">
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <h1 style={{margin:0,fontSize:24}}>Dashboard de Progresso</h1>
        <Link to="/" style={{color:'#1e90ff'}}>Gerenciar Metas</Link>
      </header>

      <section style={{background:'#18212b',padding:16,borderRadius:10,marginBottom:28}}>
        <h2 style={{marginTop:0,fontSize:16,letterSpacing:.5}}>Progresso Total</h2>
        <div style={{marginTop:8}}>
          <div style={{height:22,background:'#223446',borderRadius:12,overflow:'hidden',position:'relative'}}>
            <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:'#fff',fontWeight:600, mixBlendMode:'difference'}}>
              {total.currentSum} / {total.targetSum} ({total.pct.toFixed(1)}%)
            </div>
            <div style={{height:'100%',width: total.pct+'%',background:'linear-gradient(90deg,#1e90ff,#53b4ff)',transition:'width .6s ease'}} />
          </div>
        </div>
      </section>

      <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:24,marginTop:32}}>
        <div style={{background:'#18212b',padding:16,borderRadius:10}}>
          <h3 style={{marginTop:0,fontSize:15}}>Barras Empilhadas (Atual vs Restante)</h3>
          {stackedData.length === 0 ? <p style={{opacity:.7}}>Sem dados.</p> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stackedData} margin={{top:10,right:10,left:0,bottom:0}}>
                <CartesianGrid stroke="#283546" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#8ca0b3" />
                <YAxis stroke="#8ca0b3" />
                <Tooltip contentStyle={{background:'#06121d',border:'1px solid #00d8ff'}} labelStyle={{color:'#00d8ff',fontWeight:600}} itemStyle={{color:'#f5f7fa',fontSize:12}} />
                <Bar dataKey="Atual" stackId="a">
                  {stackedData.map((e,i)=><Cell key={i} fill={e.color} />)}
                </Bar>
                <Bar dataKey="Restante" stackId="a" fill="#223446" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div style={{background:'#18212b',padding:16,borderRadius:10}}>
          <h3 style={{marginTop:0,fontSize:15}}>Distribuição Geral</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={overallDistribution} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90}>
                {overallDistribution.map((e,i)=><Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={{background:'#06121d',border:'1px solid #00d8ff'}} labelStyle={{color:'#00d8ff',fontWeight:600}} itemStyle={{color:'#f5f7fa',fontSize:12}} />
              <Legend wrapperStyle={{fontSize:12}} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:'#18212b',padding:16,borderRadius:10}}>
          <h3 style={{marginTop:0,fontSize:15}}>Participação por Equipe (Atual)</h3>
          {teamShareData.length === 0 ? <p style={{opacity:.7}}>Sem dados.</p> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={teamShareData} dataKey="value" nameKey="name" outerRadius={90}>
                  {teamShareData.map((e,i)=><Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{background:'#06121d',border:'1px solid #00d8ff'}} labelStyle={{color:'#00d8ff',fontWeight:600}} itemStyle={{color:'#f5f7fa',fontSize:12}} />
                <Legend wrapperStyle={{fontSize:12}} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24,alignItems:'stretch'}}>
        <div style={{background:'#18212b',padding:16,borderRadius:10,minHeight:320}}>
          <h3 style={{marginTop:0,fontSize:15}}>Comparativo Atual vs Meta (3 equipes)</h3>
          {barData.length === 0 ? <p style={{opacity:.7}}>Sem dados.</p> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData} margin={{top:10,right:10,left:0,bottom:0}}>
                <CartesianGrid stroke="#283546" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#8ca0b3" />
                <YAxis stroke="#8ca0b3" />
                <Tooltip contentStyle={{background:'#06121d',border:'1px solid #00d8ff'}} labelStyle={{color:'#00d8ff',fontWeight:600}} itemStyle={{color:'#f5f7fa',fontSize:12}} />
                <Bar dataKey="Meta" fill="#375574" />
                <Bar dataKey="Atual" >
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                  <LabelList dataKey="Percent" position="top" formatter={(v)=> v+'%'} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div style={{background:'#18212b',padding:16,borderRadius:10,minHeight:320}}>
          <h3 style={{marginTop:0,fontSize:15}}>Percentual por Equipe</h3>
          {radialData.length === 0 ? <p style={{opacity:.7}}>Sem dados.</p> : (
            <ResponsiveContainer width="100%" height={260}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" barSize={14} data={radialData}>
                <RadialBar minAngle={5} clockWise background dataKey="uv" />
                <Legend wrapperStyle={{fontSize:12}} />
                <Tooltip contentStyle={{background:'#06121d',border:'1px solid #00d8ff'}} labelStyle={{color:'#00d8ff',fontWeight:600}} itemStyle={{color:'#f5f7fa',fontSize:12}} formatter={(v)=> v+ '%'} />
              </RadialBarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <div style={{display:'flex',justifyContent:'space-between',marginTop:24,alignItems:'center'}}>
        <div style={{display:'flex',gap:8}}>
          <button type="button" onClick={prev}>Anterior</button>
          <button type="button" onClick={next}>Próximo</button>
        </div>
        <div style={{fontSize:12,opacity:.7}}>Página {page+1} / {pages}</div>
      </div>

      <section style={{marginTop:32}}>
        <h3 style={{fontSize:15,margin:'0 0 8px'}}>Dados exibidos</h3>
        <table className="goal-table">
          <thead>
            <tr><th>Equipe</th><th>Meta</th><th>Atual</th><th>%</th></tr>
          </thead>
          <tbody>
            {pageGoals.map(g => {
              const pct = g.target ? Math.min(100, Math.round((g.current||0)/g.target*100)) : 0;
              return <tr key={g.id}><td>{g.team}</td><td>{g.target}</td><td>{g.current||0}</td><td>{pct}%</td></tr>;
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
