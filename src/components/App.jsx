import React, { useEffect, useState } from 'react';
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { makeStyles } from "@mui/styles";
import makeKnnWsClient from './knn-ws-client.mjs';
import canvasToMnistB64 from './canvas-to-mnist-b64.mjs';
import Canvas from './canvas.jsx';
import TextField from '@mui/material/TextField';


// const { useState } = React;


// const DEFAULT_WS_URL = 'https://zdu.binghamton.edu:2345';

export default function App(props) {
  const useStyles = makeStyles((theme) => ({
    root: {
      backgroundColor: "#30312F",
    },
  }));

  const [imageData, setImageData] = useState(null);
  const [label, setLabel] = useState(null);
  const [wsurl, setWsurl] = useState('https://zdu.binghamton.edu:2345');

  const classes = useStyles();

  //call classify from knn-ws-client.mjs


  useEffect(() => {
    const knnWsClient = makeKnnWsClient();
    knnWsClient.wsUrl = wsurl;
    const classify = async () => {
      const result = await knnWsClient.classify(imageData);
      return result;
    }


    const handleClassify = async (result) => {
      const res = await knnWsClient.getImage(result.val.id);
      return res;

    };

    const handleClassifyAndImage = async () => {
      const result = await classify();
      const res = await handleClassify(result);
      setLabel(res.val.label);
    }

    if (imageData) {
      handleClassifyAndImage();
    }

  }, [imageData, setImageData, wsurl, setWsurl]);
  // const [wsUrl, setWsUrl] = React.useState('');

  const toB65 = (canvas) => {
    const b64 = canvasToMnistB64(canvas);
    // console.log(b64);
    setImageData(b64);
    return b64;

  }

  function handleLabelChange(newValue) {
    setLabel(newValue);

  }

  function handleUrlChange(event) {
    setWsurl(event.target.value);

  }


  return (
    <div className="App">
      <AppBar position="static" className={classes.root}>
        <Toolbar>
          <Typography component={"span"} style={{ flexGrow: 1, textAlign: "center" }}>
            <h2 >KNN Classifier</h2>

          </Typography>
        </Toolbar>
      </AppBar>
      <div style={{ display: "flex", justifyContent: "center", marginTop: 20, marginBottom: 20 }}>
        <TextField id="outlined-basic" label="url" variant="outlined" multiline
          rows={4} value={wsurl} onChange={handleUrlChange} />
      </div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Canvas getImage={toB65} onChange={handleLabelChange} />
      </div>
      <Typography component={"span"} style={{ flexGrow: 1, textAlign: "center" }}>
        <h2 >{label}</h2>
      </Typography>

    </div>
  )
}