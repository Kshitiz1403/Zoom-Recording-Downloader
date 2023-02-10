import './App.css';
import { useEffect, useState } from 'react'

function App() {
  const [transactionID, setTransactionID] = useState("")
  const [data, setData] = useState({})
  const [isAvailableForDownload, setIsAvailableForDownload] = useState(false)

  useEffect(() => {
    getStatus()
  }, [])


  useEffect(() => {
    Object.keys(data).map(record => {
      if (data[record] != "downloaded") return setIsAvailableForDownload(false)
    })
    return setIsAvailableForDownload(true)
  }, [data])


  const getStatus = async () => {
    const transactionID = window.location.href.split("/").slice(-1).pop();
    setTransactionID(transactionID)
    console.log(transactionID)
    fetch(`https://zoom.kshitizagrawal.in/api/status/${transactionID}`).then(response => response.json()).then(data => { console.log(data); setData(data) })

  }

  const downloadAll = async () => {
    const url = await fetch(`https://zoom.kshitizagrawal.in/download/${transactionID}`).then(response => response.json());
    const a = document.createElement("a");
    a.href = url
    a.download = url;
    a.click();
  }

  return (
    <div className='App-header'>
      <h1>Transaction ID {transactionID}</h1>
      <div style={{}}>
        {Object.keys(data).map(record => <div style={{ display: 'flex', justifyContent: 'space-between', }}> <div style={{ marginRight: 20 }}>{record}</div><div> {data[record]}</div></div>)}
      </div>
      <button type='submit' disabled={!isAvailableForDownload} onClick={downloadAll} >Download</button>
    </div>
  );
}

export default App;
