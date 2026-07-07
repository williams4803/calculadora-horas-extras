import { useEffect, useMemo, useState } from "react";
import "./App.css";

const initialFormState = {
  salario: "",
  jornadaMensal: "220",
  horasExtras: "0",
  percentual: "50",
};

const STORAGE_KEY = "horas-extras-history";

const loadHistory = () => {
  // keep localStorage fallback; initial value loaded in useEffect on mount
  return [];
};

function App() {
  const [formData, setFormData] = useState(initialFormState);
  const [history, setHistory] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [employeeForm, setEmployeeForm] = useState({
    nome: '',
    matricula: '',
    cpf: '',
    cargo: '',
    setor: '',
    jornada: '',
    diasSemana: [],
    salario: '',
    situacao: 'Ativo'
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const result = useMemo(() => {
    const salario = parseFloat(formData.salario || 0);
    const jornadaMensal = parseFloat(formData.jornadaMensal || 0);
    const horasExtras = parseFloat(formData.horasExtras || 0);
    const percentual = parseFloat(formData.percentual || 0);

    if (!salario || !jornadaMensal || !horasExtras) {
      return null;
    }

    const valorHora = salario / jornadaMensal;
    const valorHorasExtras = valorHora * (1 + percentual / 100) * horasExtras;
    const total = valorHorasExtras;

    return {
      valorHora,
      valorHorasExtras,
      total,
    };
  }, [formData]);

  useEffect(() => {
    // persist locally as fallback
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }
  }, [history]);

  // load history from API on mount, fallback to localStorage
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (typeof window === 'undefined') return;
      try {
        const res = await fetch('http://localhost:4000/api/history');
        if (!res.ok) throw new Error('api');
        const data = await res.json();
        if (mounted && Array.isArray(data)) setHistory(data);
        return;
      } catch (e) {
        // fallback to localStorage
        try {
          const saved = window.localStorage.getItem(STORAGE_KEY);
          if (saved) setHistory(JSON.parse(saved));
        } catch {}
      }
    };
    load();
    return () => { mounted = false };
  }, []);

  // load employees from API on mount (with localStorage fallback)
  useEffect(() => {
    let mounted = true;
    const loadEmployees = async () => {
      if (typeof window === 'undefined') return;
      try {
        const res = await fetch('http://localhost:4000/api/funcionarios');
        if (!res.ok) throw new Error('api');
        const data = await res.json();
        if (mounted && Array.isArray(data)) setEmployees(data);
        return;
      } catch (e) {
        try {
          const saved = window.localStorage.getItem('funcionarios');
          if (saved) setEmployees(JSON.parse(saved));
        } catch {}
      }
    };
    loadEmployees();
    return () => { mounted = false };
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!result) {
      return;
    }

    const novoCalculo = {
      id: Date.now(),
      salario: parseFloat(formData.salario),
      jornadaMensal: parseFloat(formData.jornadaMensal),
      horasExtras: parseFloat(formData.horasExtras),
      percentual: parseFloat(formData.percentual),
      total: result.total,
    };

    setHistory((prev) => {
      const next = [novoCalculo, ...prev].slice(0, 50);
      // try sending to server, but don't block UI
      fetch('http://localhost:4000/api/history', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(novoCalculo),
      }).catch(() => {});
      return next;
    });
  };

  const handleClearHistory = () => {
    setHistory([]);

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleEmployeeChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'diasSemana') {
      setEmployeeForm((p) => {
        const existing = new Set(p.diasSemana || []);
        if (checked) existing.add(value);
        else existing.delete(value);
        return { ...p, diasSemana: Array.from(existing) };
      });
      return;
    }
    setEmployeeForm((p) => ({ ...p, [name]: value }));
  };

  const handleEmployeeSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...employeeForm };
    // try server
    try {
      const res = await fetch('http://localhost:4000/api/funcionarios', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload)
      });
      if (res.ok) {
        const saved = await res.json();
        setEmployees((prev) => [saved, ...prev]);
        setEmployeeForm({ nome: '', matricula: '', cpf: '', cargo: '', setor: '', jornada: '', salario: '', situacao: 'Ativo' });
        return;
      }
    } catch (err) {
      // fallback to local
    }
    // fallback: persist locally
    const localItem = { id: Date.now(), ...payload };
    setEmployees((prev) => [localItem, ...prev]);
    try { window.localStorage.setItem('funcionarios', JSON.stringify([localItem, ...employees])); } catch {}
  };

  const handleClearEmployees = async () => {
    setEmployees([]);
    try { await fetch('http://localhost:4000/api/funcionarios', { method: 'DELETE' }); } catch {}
    try { window.localStorage.removeItem('funcionarios'); } catch {}
  };

  return (
    <div className="app">
      <h1>Calculadora de Horas Extras</h1>
      <p>Calcule o valor das horas extras com base no salário por hora.</p>

      <form className="calculator-form" onSubmit={handleSubmit}>
        <label>
          <span>Salário</span>
          <input
            type="number"
            name="salario"
            value={formData.salario}
            onChange={handleChange}
            min="0"
            step="0.01"
            required
          />
        </label>

        <label>
          <span>Jornada mensal</span>
          <select name="jornadaMensal" value={formData.jornadaMensal} onChange={handleChange}>
            <option value="180">180 horas</option>
            <option value="200">200 horas</option>
            <option value="220">220 horas</option>
            <option value="240">240 horas</option>
          </select>
        </label>

        <label>
          <span>Horas extras</span>
          <input
            type="number"
            name="horasExtras"
            value={formData.horasExtras}
            onChange={handleChange}
            min="0"
            step="0.01"
            required
          />
        </label>

        <label>
          <span>Percentual</span>
          <select name="percentual" value={formData.percentual} onChange={handleChange}>
            <option value="50">50%</option>
            <option value="60">60%</option>
            <option value="70">70%</option>
            <option value="100">100%</option>
          </select>
        </label>

        <button type="submit">Calcular</button>
      </form>

      {result && (
        <div className="summary-card">
          <h2>Total a receber</h2>
          <p><strong>Valor da hora:</strong> R$ {result.valorHora.toFixed(2)}</p>
          <p><strong>Horas extras:</strong> R$ {result.valorHorasExtras.toFixed(2)}</p>
          <p className="total"><strong>Total:</strong> R$ {result.total.toFixed(2)}</p>
        </div>
      )}

      {history.length > 0 && (
        <div className="history-card">
          <div className="history-header">
            <h2>Histórico dos cálculos</h2>
            <button type="button" className="secondary-button" onClick={handleClearHistory}>
              Limpar histórico
            </button>
          </div>
          <ul>
            {history.map((item) => (
              <li key={item.id}>
                <span>{Number(item.horasExtras).toFixed(2)}h a {Number(item.percentual)}% • R$ {item.total.toFixed(2)}</span>
                <small>{Number(item.jornadaMensal)}h/mês</small>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="employees-section">
          <h2>Cadastro de Funcionários</h2>
        <form className="employee-form" onSubmit={handleEmployeeSubmit}>
          <label>
            <span>Nome</span>
            <input name="nome" value={employeeForm.nome} onChange={handleEmployeeChange} required />
          </label>
          <label>
            <span>Matrícula</span>
            <input name="matricula" value={employeeForm.matricula} onChange={handleEmployeeChange} />
          </label>
          <label>
            <span>CPF</span>
            <input name="cpf" value={employeeForm.cpf} onChange={handleEmployeeChange} />
          </label>
          <label>
            <span>Cargo</span>
            <input name="cargo" value={employeeForm.cargo} onChange={handleEmployeeChange} />
          </label>
          <label>
            <span>Setor</span>
            <input name="setor" value={employeeForm.setor} onChange={handleEmployeeChange} />
          </label>
          <div style={{ gridColumn: '1 / -1' }}>
            <span style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>Dias da semana</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'].map((d) => (
                <label key={d} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input type="checkbox" name="diasSemana" value={d} checked={(employeeForm.diasSemana||[]).includes(d)} onChange={handleEmployeeChange} />
                  <span>{d}</span>
                </label>
              ))}
            </div>
          </div>
          <label>
            <span>Jornada</span>
            <input name="jornada" value={employeeForm.jornada} onChange={handleEmployeeChange} />
          </label>
          <label>
            <span>Salário</span>
            <input name="salario" value={employeeForm.salario} onChange={handleEmployeeChange} />
          </label>
          <label>
            <span>Situação</span>
            <select name="situacao" value={employeeForm.situacao} onChange={handleEmployeeChange}>
              <option>Ativo</option>
              <option>Inativo</option>
            </select>
          </label>
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8 }}>
            <button type="submit">Salvar funcionário</button>
            <button type="button" className="secondary-button" onClick={handleClearEmployees}>Limpar funcionários</button>
          </div>
        </form>

        <div className="history-card">
          <h2>Funcionários cadastrados</h2>
          <ul>
            {employees.map((emp) => (
              <li key={emp.id}>
                <strong>{emp.nome}</strong> — {emp.cargo} • {emp.setor} • R$ {emp.salario}
                {emp.diasSemana && emp.diasSemana.length > 0 && (
                  <div><small>Dias: {emp.diasSemana.join(', ')}</small></div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
