"use client";
import React from 'react';

/*
const pushDataToElasticsearch = async (index, id, data) => {
  try {
    const response = await fetch(`/api-elastic/${index}/_doc/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log('Data indexed:', responseData);
  } catch (error) {
    console.error('Error indexing data:', error);
  }
};*/


// Example of calling the API route from a page or component in Next.js

// const sendDataToElastic = async () => {
//   try {
//     const response = await fetch('http://10.171.134.51:3000/api/elasticsearch/push/', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         exec_time: 'your_exec_time',
//         name: 'your_name',
//         date: 'your_date',
//       }),
//     });

//     if (!response.ok) {
//       throw new Error(`Error: ${response.statusText}`);
//     }

//     const data = await response.json();
//     console.log(data);
//   } catch (error) {
//     console.error('Error sending data:', error);
//   }
// }; 
const postDataToSql = async (t_wd_tag,t_mc_name) => {
  try{
      console.log("push data to SQL Server")
      const response = await fetch('http://localhost:3000/api/sql/push/');
      console.log("push data to elasticsearch  Done")
  }catch(err){
    console.log("Error push data to elasticsearch", err)
  }  
};

  


const postDataToCreateMachineName = async (t_wd_tag,t_mc_name) => {
  try {
    const response = await fetch('http://localhost:3000/api/machine/create-machine', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        WD_TAG: t_wd_tag,
        MACHINE_NAME: t_mc_name,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('Error sending data:', error);
  }
};



const Page = () => {
  const handleClick = () => {
      //sendDataToElastic();
      //postDataToCreateMachineName();
            

        // แสดงผลในรูปแบบ JSON
        //console.log(jsonData);
       
         //       postDataToCreateMachineName("RT-77003", "SCREW SORTING");
     
        

      //  console.log('Finish');
      postDataToSql("","");
      
  }

  return (
    <div style={{padding:'10px'}}>
      <h1>Page for Test</h1>
      <p>Test Function :</p>
      <button onClick={handleClick}>Click me</button>
    </div>
  );
}

export default Page;
