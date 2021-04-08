import React from 'react';
import ReactDOM from 'react-dom';
import './bootstrap.css';
import './index.css';

import * as serviceWorkerRegistration from './serviceWorkerRegistration';

import pkg from '../package.json';

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function App() {
  const FileName = React.createRef();
  const InputNumber = React.createRef();
  const QuestionText = React.createRef();

  const [howToPlay, setHowToPlay] = React.useState(false);
  const [showQuestion, setShowQuestion] = React.useState(false);
  const [boxes, setBoxes] = React.useState([]);
  const [usedAll, setUsedAll] = React.useState(false);

  const [repeat, setRepeat] = React.useState(false);
  const [box, setBox] = React.useState({ number: 0, question: null });
  const [message, setMessage] = React.useState(null);

  const [groups, setGroups] = React.useState([]);

  let file = decodeURI(window.location.search.substring(1));
  if (file === "") file = "Padrao";

  async function install() {
    setMessage(null);

    let filename = null;
    if (FileName.current !== null)
      filename = FileName.current.value;
    else
      filename = localStorage.getItem("file");

    console.log("Instalando perguntas", filename);

    if (filename !== null) {
      const request = await fetch("https://api.github.com/gists/d301e9df50ec8b0d757417cf1734e524");
      const response = await request.json();
      console.log(response.files);
      const data = response.files[filename + ".json"];

      if (data !== undefined) {
        let boxesRaw = data.content.replace(/(\r\n|\n|\r|\s\s)/gm, "");
        boxesRaw = JSON.parse(boxesRaw);
        // console.log(JSON.stringify(boxesRaw))
        localStorage.setItem("file", filename);
        localStorage.setItem("boxes", JSON.stringify(boxesRaw));
        setBoxes(boxesRaw);

        console.log(boxesRaw.length + " caixa(s) instaladas(s) na memória");
      } else {
        console.log("Arquivo não existe")
        setMessage("Essas caixas não existem");
      }
    } else {
      console.log("não update")
      setMessage("Essas caixas não existem");
    }
  };

  function unistall() {
    getGroups();
    setBoxes([]);
    setUsedAll(false);
    localStorage.removeItem("boxes");
    localStorage.removeItem("file");
    localStorage.removeItem("usedBoxes");
    localStorage.removeItem("previousBox");
    localStorage.removeItem("previousQuestion");
  }

  function getQuestion(requestedBox) {
    let usedBoxes = localStorage.getItem("usedBoxes");

    if (usedBoxes === null) usedBoxes = [];
    else usedBoxes = JSON.parse(usedBoxes);

    let question;
    let ShuffledList = shuffle(boxes);
    question = ShuffledList[requestedBox - 1];

    if (question === localStorage.getItem("previousQuestion") || usedBoxes.includes(question)) {
      question = getQuestion(requestedBox)
    }

    return question;
  }

  const sortBox = (event) => {
    event.preventDefault();
    let requestedBox = InputNumber.current.value;
    let previousBox = localStorage.getItem("previousBox");
    let usedBoxes = localStorage.getItem("usedBoxes");

    if (usedBoxes === null) usedBoxes = [];
    else usedBoxes = JSON.parse(usedBoxes);

    if (usedAll) {
      window.alert("todas as perguntas foram usadas");
    } else {
      let number, question;
      if (previousBox === null || previousBox !== requestedBox) {
        question = getQuestion(requestedBox);
        number = requestedBox;

        if (!repeat) usedBoxes.push(question);

        if (usedBoxes.length >= boxes.length) setUsedAll(true);

        usedBoxes = JSON.stringify(usedBoxes);

        localStorage.setItem("previousBox", number);
        localStorage.setItem("usedBoxes", usedBoxes);
        localStorage.setItem("previousQuestion", question);
      } else {
        number = localStorage.getItem("previousBox");
        question = localStorage.getItem("previousQuestion");
      }

      setBox({ number, question });
      InputNumber.current.value = "";
      setShowQuestion(true);
    }
  };

  const copy = (e) => {
    var copyText = document.getElementById("question-text");
    copyText.select();
    copyText.setSelectionRange(0, 99999);

    document.execCommand("copy");
    alert("Pergunta/Desafio Copiado\n\n" + copyText.value);
  }

  async function getGroups() {
    const request = await fetch("https://api.github.com/gists/d301e9df50ec8b0d757417cf1734e524");
    const response = await request.json();

    let list = Object.keys(response.files);
    console.log(list);
    let grouplist = [];
    list.forEach(group => {
      // console.log(group.search("hidden"));
      if (group.search("!") !== 0)
        grouplist.push(group);
    });

    console.log(grouplist)
    setGroups(grouplist);
  }

  React.useEffect(() => {
    if (localStorage.getItem("boxes") !== null) {
      setBoxes(JSON.parse(localStorage.getItem("boxes")));

      if (localStorage.getItem("repeat") === null) {
        setRepeat(true);
        localStorage.setItem("repeat", "true")
      } else {
        setRepeat(JSON.parse(localStorage.getItem("repeat")))
      }
      if (localStorage.getItem("usedBoxes") !== null) {
        let a = JSON.parse(localStorage.getItem("boxes"));
        let b = JSON.parse(localStorage.getItem("usedBoxes"));

        if (a >= b && !usedAll) {
          setUsedAll(true);
        }
      }
    }


    getGroups();
    updateIndicator();
  }, [usedAll]);

  function updateIndicator() {
    setOfflineAlert(navigator.onLine);
  }

  function clearUsed() {
    localStorage.removeItem("usedBoxes");
    setUsedAll(false);
  }

  function changeRepeat(status) {
    localStorage.setItem("repeat", JSON.stringify(status));
    setRepeat(status);
  }

  // Update the online status icon based on connectivity
  window.addEventListener('online', updateIndicator);
  window.addEventListener('offline', updateIndicator);

  const [offlineAlert, setOfflineAlert] = React.useState(true);
  return (
    <section className="app container brincadeira py-3">
      {!offlineAlert && <div className="alert alert-danger">Você está offline</div>}
      {
        showQuestion ?
          <section className="text-center">
            <h2 className="pt-3 font-weight-bold">📦 {box.number.padStart(2, '0')}/{boxes.length}</h2>
            <div className="font-weight-light h2 py-3" onClick={() => { copy(); setShowQuestion(false); }}>{box.question}</div>
            <textarea id="question-text" ref={QuestionText} className="box-textarea" defaultValue={"📦 " + box.number.padStart(2, '0') + ": " + box.question}></textarea>

            <div className="fixed-bottom py-3 mx-auto">
              <div className="container">
                <p className="text-muted small">(toque no texto para copiar)</p>
                <button onClick={() => { setShowQuestion(false); window.open("whatsapp://send?text=" + encodeURI("📦 " + box.number.padStart(2, '0') + ": " + box.question)); }} className="btn btn-success btn-block font-weight-bold text-uppercase mb-2">Enviar no WhatsApp</button>
                <button onClick={() => setShowQuestion(false)} className="btn btn-info btn-block font-weight-bold text-uppercase">Escolher outro</button>
              </div>
            </div>
          </section>
          :
          <>
            <button type="button" className="btn btn-outline-info btn-sm p-0 px-2 float-right" onClick={() => setHowToPlay(!howToPlay)}>{howToPlay ? "Fechar instruções" : "Como jogar?"}</button>
            <small onClick={() => unistall()}>v{pkg.version}{boxes.length > 0 && " (?)"}</small>

            <header className="my-4 text-center h4">
              <span className="display-4 d-block float-left">📦</span>
              <span className="text-uppercase">Caixa de <b>desafios e perguntas</b></span>
              {boxes.length > 0 && <small className="text-muted d-block" onClick={() => install()}>{boxes.length} caixas</small>}
            </header>

            {howToPlay ?
              <>
                <section className={`mb-5 bg-light como-jogar small`}>
                  <div className="py-3">
                    <header className="">
                      <h3 className="font-weight-bold">Como jogar</h3>
                    </header>
                    <ol className="list-unstyled">
                      <li className="pb-2">01. Peça para alguém escolher um número de <b>01</b> à <b>{boxes.length}</b>.</li>
                      <li className="pb-2">02. Digite o <b className="btn btn-outline-primary btn-sm small p-0 px-2">Número da Caixa</b> e clique no botão <b className="btn btn-success btn-sm small p-0 px-2 text-uppercase">Sortear</b>.</li>
                      <li className="pb-2">03. <b>Tire um Print</b>, <b>copie o texto</b> ou clique no botão <b className="btn btn-success btn-sm small p-0 px-2">Enviar no WhatsApp</b> e mande direto para pessoa/grupo.</li>
                      <li className="pb-2">04. A pessoa que Pagar o Desafio, poderá desafiar outra pessoa.</li>
                    </ol>

                    <p>OBS: A ordem das caixas é <b>definida aleatoriamente de <u>usuário para usuário</u></b> <span className="text-danger">não adianta escolher o mesmo número sempre, pois a pergunta/desafio muda.</span></p>

                    <p className="bg-danger text-light text-center p-3">Atenção! Pode conter perguntas e desafios +18.</p>
                  </div>
                </section>
              </>
              :
              <>
                {
                  boxes.length === 0 ?
                    <>
                      {file !== "Padrao" ?
                        <input ref={FileName} type="hidden" value={file} />
                        :
                        <select ref={FileName} className="form-control custom-select mt-5">
                          <option>Selecione as perguntas</option>
                          {groups.map((group, index) =>
                            <option key={index} value={group.replace(".json", "")}>{group.replace(".json", "")}</option>
                          )}
                        </select>
                      }

                      <label htmlFor="repetir" className={`d-block text-center py-3`}><input type="checkbox" id="repetir" defaultChecked={repeat} onChange={(event) => changeRepeat(event.target.checked)} /> Repetir perguntas?</label>
                      <button type="button" className="btn btn-primary font-weight-bold text-bold btn-block my-3" onClick={() => install()}>Instalar Perguntas</button>

                      <div className="small">
                        <p className="d-block mb-2">Este aplicativo não acessa dados, nem arquivos do seu smartphone/computador. Não monitora nem usa sua posição GPS, câmera, mensagens e afins.</p>
                        <p>Aplicativo desenvolvido para diversão e <u>estudo de tecnologias</u> como: ReactJS, PWA Build, Manipulação de LocalStorage, Interação entre Navegador e WhatsApp, Push Notification, ServiceWorkers, além de prova de conceito de uma aplicação de Perguntas e Deafios.</p>
                      </div>
                      {file !== "Padrao" && "Caixas: " + file}
                      {message !== null && <p>{message}</p>}
                    </>
                    :
                    <>
                      <form className="form-container fixed-bottom pb-3 bg-light" onSubmit={sortBox}>
                        <div className="container">
                          {usedAll ?
                            <>
                              <p className="alert alert-info text-center">Todas as perguntas e desafios foram feitos :O</p>

                              <button className="btn btn-block btn-lg w-100 btn-info text-uppercase font-weight-bold" onClick={() => { clearUsed() }}>Reiniciar</button>
                            </>
                            :
                            <>
                              <div className="form-group input-group">
                                <input type="number" pattern="[0-9]*" inputMode="numeric" ref={InputNumber} className="form-control text-center" placeholder="Número da caixa" maxlenght="3" autoComplete="off" autoFocus required min="0" max={boxes.length} />
                              </div>
                              <button type="submit" className="btn btn-success btn-block font-weight-bold text-uppercase">Sortear</button>
                            </>
                          }
                        </div>
                      </form>
                    </>
                }
              </>
            }
          </>
      }
    </section>
  )
}


ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

serviceWorkerRegistration.register();