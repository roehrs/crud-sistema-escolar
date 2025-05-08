import './App.css';
import { useState, useEffect } from 'react';
import { Auth } from './components/auth';
import { db, auth } from './firebase-config';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';

function App() {
  const [professor, setProfessor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [turmas, setTurmas] = useState([]);
  const [turmaSelecionada, setTurmaSelecionada] = useState('');
  const [alunos, setAlunos] = useState([]);
  const [novoAluno, setNovoAluno] = useState({
    nome: '',
    frequencia: '',
    n1: '',
    n2: '',
    n3: '',
  });
  const [mostraFormNovo, setMostraFormNovo] = useState(false);

  const logOut = async () => {
    try {
      await signOut(auth);
      <Auth />;
    } catch (err) {
      console.error(err);
    }
  };

  // Buscar turmas do Firestore
  useEffect(() => {
    const fetchTurmas = async () => {
      const snapshot = await getDocs(collection(db, 'turmas'));
      const lista = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTurmas(lista);
    };
    fetchTurmas();
  }, []);

  // Buscar alunos quando turma é selecionada
  useEffect(() => {
    const fetchAlunos = async () => {
      if (!turmaSelecionada) return;
      const alunosSnap = await getDocs(
        collection(db, 'turmas', turmaSelecionada, 'alunos')
      );
      const lista = alunosSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAlunos(lista);
    };
    fetchAlunos();
  }, [turmaSelecionada]);

  // Lidar com mudanças nos inputs
  const handleInputChange = (index, campo, valor) => {
    const novos = [...alunos];
    novos[index][campo] = valor;
    setAlunos(novos);
  };

  // Calcular média e situação (exemplo simples)
  const calcularMediaESituacao = (aluno) => {
    const { n1 = 0, n2 = 0, n3 = 0, frequencia = 0 } = aluno;
    const media = ((+n1 + +n2 + +n3) / 3).toFixed(1);
    const situacao = media >= 6 && frequencia >= 75 ? 'Aprovado' : 'Reprovado';
    return { media, situacao };
  };

  // Salvar alterações de um aluno
  const salvarAluno = async (aluno) => {
    const ref = doc(db, 'turmas', turmaSelecionada, 'alunos', aluno.id);
    const { media, situacao } = calcularMediaESituacao(aluno);
    await updateDoc(ref, {
      ...aluno,
      media: parseFloat(media),
      situacao,
    });
    alert('Aluno atualizado!');
  };

  // Excluir aluno
  const excluirAluno = async (aluno) => {
    const ref = doc(db, 'turmas', turmaSelecionada, 'alunos', aluno.id);
    await deleteDoc(ref);
    setAlunos(alunos.filter((a) => a.id !== aluno.id));
    alert('Aluno excluído.');
  };

  //Função para adicionar novo aluno
  const adicionarAluno = async () => {
    if (!turmaSelecionada || !novoAluno.nome) {
      alert('Preencha o nome e selecione uma turma.');
      return;
    }

    const { media, situacao } = calcularMediaESituacao(novoAluno);

    const alunoRef = collection(db, 'turmas', turmaSelecionada, 'alunos');
    const novo = {
      ...novoAluno,
      media: parseFloat(media),
      situacao,
    };

    await addDoc(alunoRef, novo);

    // Atualiza a lista
    const alunosSnap = await getDocs(
      collection(db, 'turmas', turmaSelecionada, 'alunos')
    );
    const lista = alunosSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setAlunos(lista);

    // Limpa formulário
    setNovoAluno({ nome: '', frequencia: '', n1: '', n2: '', n3: '' });
    setMostraFormNovo(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Buscando os dados do professor pelo UID
        const profRef = doc(db, 'professores', user.uid);
        const profSnap = await getDoc(profRef);
        if (profSnap.exists()) {
          setProfessor({ ...profSnap.data(), id: profSnap.id });
        } else {
          console.alert(
            "Usuário logado mas não encontrado na coleção 'professores'"
          );
        }
      } else {
        setProfessor(null); // logout
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <p>Carregando...</p>;

  if (!professor) return <Auth />;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Olá, Prof. {professor.nome}</h2>

      <label>
        Selecione uma turma:
        <select
          onChange={(e) => setTurmaSelecionada(e.target.value)}
          value={turmaSelecionada}
        >
          <option value="">--</option>
          {turmas.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nome}
            </option>
          ))}
        </select>
      </label>
      {turmaSelecionada && (
        <>
          <button onClick={() => setMostraFormNovo(!mostraFormNovo)}>
            {mostraFormNovo ? 'Cancelar' : 'Adicionar Aluno'}
          </button>

          {mostraFormNovo && (
            <div style={{ marginTop: '15px', marginBottom: '20px' }}>
              <input
                placeholder="Nome"
                value={novoAluno.nome}
                onChange={(e) =>
                  setNovoAluno({ ...novoAluno, nome: e.target.value })
                }
              />
              <input
                placeholder="Frequência"
                type="number"
                value={novoAluno.frequencia}
                onChange={(e) =>
                  setNovoAluno({ ...novoAluno, frequencia: e.target.value })
                }
              />
              <input
                placeholder="N1"
                type="number"
                value={novoAluno.n1}
                onChange={(e) =>
                  setNovoAluno({ ...novoAluno, n1: e.target.value })
                }
              />
              <input
                placeholder="N2"
                type="number"
                value={novoAluno.n2}
                onChange={(e) =>
                  setNovoAluno({ ...novoAluno, n2: e.target.value })
                }
              />
              <input
                placeholder="N3"
                type="number"
                value={novoAluno.n3}
                onChange={(e) =>
                  setNovoAluno({ ...novoAluno, n3: e.target.value })
                }
              />
              <button onClick={adicionarAluno}>Salvar Aluno</button>
            </div>
          )}
        </>
      )}
      {alunos.length > 0 && (
        <table
          border="1"
          cellPadding="8"
          style={{ marginTop: '20px', width: '100%' }}
        >
          <thead>
            <tr>
              <th>Aluno</th>
              <th>Frequência (%)</th>
              <th>N1</th>
              <th>N2</th>
              <th>N3</th>
              <th>Média</th>
              <th>Situação</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {alunos.map((aluno, index) => {
              const { media, situacao } = calcularMediaESituacao(aluno);
              return (
                <tr key={aluno.id}>
                  <td>{aluno.nome}</td>
                  <td>
                    <input
                      type="number"
                      value={aluno.frequencia || ''}
                      onChange={(e) =>
                        handleInputChange(index, 'frequencia', e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={aluno.n1 || ''}
                      onChange={(e) =>
                        handleInputChange(index, 'n1', e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={aluno.n2 || ''}
                      onChange={(e) =>
                        handleInputChange(index, 'n2', e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={aluno.n3 || ''}
                      onChange={(e) =>
                        handleInputChange(index, 'n3', e.target.value)
                      }
                    />
                  </td>
                  <td>{media}</td>
                  <td>{situacao}</td>
                  <td>
                    <button onClick={() => salvarAluno(aluno)}>Salvar</button>{' '}
                    <button onClick={() => excluirAluno(aluno)}>Excluir</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <div>
        <button onClick={logOut}> Sair </button>
      </div>
    </div>
  );
}

export default App;
