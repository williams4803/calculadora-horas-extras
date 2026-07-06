import { useState } from "react";
import "./Calculadora.css";

function Calculadora() {
  const [salario, setSalario] = useState("");
  const [carga, setCarga] = useState(220);
  const [hora50, setHora50] = useState(0);
  const [hora100, setHora100] = useState(0);
  const [resultado, setResultado] = useState(null);

  function calcular() {
    const valorHora = salario / carga;

    const valor50 = valorHora * 1.5;
    const valor100 = valorHora * 2;

    const total50 = valor50 * hora50;
    const total100 = valor100 * hora100;

    const total = total50 + total100;

    setResultado({
      valorHora,
      valor50,
      valor100,
      total50,
      total100,
      total,
    });
  }

  return (
    <div className="container">

      <h1>Calculadora de Horas Extras</h1>

      <label>Salário Mensal</label>

      <input
        type="number"
        value={salario}
        onChange={(e) => setSalario(Number(e.target.value))}
      />

      <label>Carga Horária</label>

      <input
        type="number"
        value={carga}
        onChange={(e) => setCarga(Number(e.target.value))}
      />

      <label>Horas Extras 50%</label>

      <input
        type="number"
        value={hora50}
        onChange={(e) => setHora50(Number(e.target.value))}
      />

      <label>Horas Extras 100%</label>

      <input
        type="number"
        value={hora100}
        onChange={(e) => setHora100(Number(e.target.value))}
      />

      <button onClick={calcular}>
        Calcular
      </button>

      {resultado && (
        <div className="resultado">

          <h2>Resultado</h2>

          <p>Valor Hora: R$ {resultado.valorHora.toFixed(2)}</p>

          <p>Hora 50%: R$ {resultado.valor50.toFixed(2)}</p>

          <p>Total 50%: R$ {resultado.total50.toFixed(2)}</p>

          <p>Hora 100%: R$ {resultado.valor100.toFixed(2)}</p>

          <p>Total 100%: R$ {resultado.total100.toFixed(2)}</p>

          <hr />

          <h2>Total: R$ {resultado.total.toFixed(2)}</h2>

        </div>
      )}
    </div>
  );
}

export default Calculadora;