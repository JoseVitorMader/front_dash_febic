import './App.css';
import GoalManager from './components/GoalManager';
import { Link } from 'react-router-dom';

function App() {
  return (
    <div className="App">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h1 style={{margin:0,fontSize:24}}>Metas</h1>
        <Link to="/dashboard" style={{color:'#1e90ff'}}>Ver Dashboard</Link>
      </div>
      <GoalManager />
    </div>
  );
}

export default App;
