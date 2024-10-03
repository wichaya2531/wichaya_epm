'use client'
import { useEffect } from 'react';

const Camera = () => {
    let newWindow;
    const handleClick = (data) => {
        alert('Path Picture from Uploader :: ' + data);
        newWindow.close();
    };

    useEffect(() => {
        const openWindowButton = document.getElementById('openWindowButton');

        if (openWindowButton) {
            openWindowButton.addEventListener('click', () => {
                const width = 600;
                const height = 400;
                const left = (window.screen.width / 2) - (width / 2);
                const top = (window.screen.height / 2) - (height / 2);

                newWindow = window.open('https://172.17.70.201/e-pm/camera.html', '_blank', `width=${width},height=${height},top=${top},left=${left}`);
            });
        }
        const receiveMessage = (event) => {
            if (event.origin === 'https://172.17.70.201') {  // ตรวจสอบ origin ของข้อความที่รับมา
                handleClick(event.data);
            }
        };

        window.addEventListener('message', receiveMessage);

        return () => {
            window.removeEventListener('message', receiveMessage);
        };


    }, []);

    return (
        <div>
            <h1>Main Page</h1>
            <button id="openWindowButton">Open New Window</button>
        </div>
    );
};

export default Camera;
