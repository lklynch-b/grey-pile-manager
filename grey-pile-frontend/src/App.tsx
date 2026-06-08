import { BrowserRouter, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';

import Journal     from './pages/journal/Journal';
import Roster      from './pages/Roster';
import ModelDetail from './pages/ModelDetail';
import Paints      from './pages/Paints';
import Add         from './pages/Add';

export default function App() {
  return (
    <BrowserRouter>
      <div className="page-shell">

        <main className="page-content">
          <Routes>
            <Route index element={<Navigate to="/journal" replace />} />
            <Route path="/journal"          element={<Journal />} />
            <Route path="/roster"            element={<Roster />} />
            <Route path="/roster/units/:id" element={<ModelDetail />} />
            <Route path="/roster/models/:id" element={<ModelDetail />} />
            <Route path="/paints"           element={<Paints />} />
            <Route path="/add"              element={<Add />} />
          </Routes>
        </main>

        <nav className="tab-bar">
          <NavLink to="/journal" className="tab-bar__link">Journal</NavLink>
          <NavLink to="/roster"  className="tab-bar__link">Roster</NavLink>
          <NavLink to="/paints"  className="tab-bar__link">Paints</NavLink>
          <NavLink to="/add"     className="tab-bar__link">Add</NavLink>
        </nav>

      </div>
    </BrowserRouter>
  );
}
