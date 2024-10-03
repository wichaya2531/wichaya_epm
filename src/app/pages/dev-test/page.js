'use client'
import { useState, useEffect } from 'react';
import mqtt from 'mqtt';

const MqttTestComponent = () => {
  const [message, setMessage] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [client, setClient] = useState(null);

  const topic_adrrees = '666285b06a66ee86fa3331ce';
  const connectUrl = 'ws://172.17.70.201:9001'; 
  const options = {
    username: 'user1',
    password: 'password'
  };
  const mqttClient = mqtt.connect(connectUrl, options);

  useEffect(() => {
    mqttClient.on('connect', () => {
      
    });

    mqttClient.on('error', (err) => {
      
      mqttClient.end();
    });

    setClient(mqttClient);

    return () => {
      if (mqttClient) {
        mqttClient.end();
      }
    };
  }, []);

  const handleSendMessage = () => {
    if (client) {
      client.publish(topic_adrrees, document.getElementById('display-name').value + " Say " + message);
     
    }
  };


  const handleClickSubscribe = () => {



    mqttClient.subscribe(topic_adrrees, (err) => {
      if (!err) {
        document.getElementById('btn-connect').style.border = "1px solid green";
        document.getElementById('btn-connect').disabled = true;

        
      } else {
        console.error('Subscription error: ', err);
      }
    });
  };
  
  mqttClient.on('message', (topic, message) => {
    const receivedMessage = message.toString();
  });

  return (
    <div style={{ padding: '20px' }}>
      <h1>Change mqt baba</h1>
      <hr></hr>
      <div style={{ padding: "5px" }}>
        <label for="display-name">Topic &nbsp;: &nbsp;</label>
        <input type="text" value={topic_adrrees}
          placeholder="Enter topic"
          style={{ border: "1px solid gray;", padding: "10px" }} /> &nbsp;&nbsp;&nbsp;&nbsp;
        <button id='btn-connect' onClick={handleClickSubscribe} style={{ padding: '10px', border: "1px solid red" }}  >Subscrib</button>

      </div>



      <div style={{ padding: "5px" }}>

        <label for="display-name">Name &nbsp;: &nbsp;</label>


        <input type="text" value={displayName}
          id='display-name'
          onChange={displayName => setDisplayName(displayName.target.value)}
          placeholder="Enter name"
          style={{ border: "1px solid gray;", padding: "10px" }} /> &nbsp;&nbsp;&nbsp;&nbsp;

      </div>

      <div style={{ padding: "5px" }}>
        <input
          style={{ padding: '10px', border: '1px solid gray' }}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter message"
        />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        <button onClick={handleSendMessage} style={{ padding: '10px', border: "1px solid red" }}>Send Message</button>
      </div>


      <hr></hr>
      <div id="message-response"></div>
    </div>
  );
};

export default MqttTestComponent;
