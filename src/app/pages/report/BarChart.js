// components/BarChart.js
'use client'
import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from 'chart.js';
import useFetchReport from '@/lib/hooks/useFetchReport';

ChartJS.register(BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

const BarChart = () => {
    const [refresh, setRefresh] = useState(false);
    const { report, isLoading, error } = useFetchReport(refresh);


    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error.message}</div>;
    }

    const data = {
        labels: report.map((item) => item.userName),
        datasets: [
            {
                label: 'Number of Checklists Activated',
                backgroundColor: report.map(() => '#' + Math.floor(Math.random() * 16777215).toString(16)),
                data: report.map((item) => item.jobCount),
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Number of Checklists Activated by Each User',
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Employee Name',
                },
            },
            y: {
                title: {
                    display: true,
                    text: 'Number of Checklists',
                },
            },
        },
    };

    return <Bar data={data} options={options} />;
};

export default BarChart;
