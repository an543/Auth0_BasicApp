import TestJS from './TestJs';
import ConsoleLogIt from './ConsoleLogIt';
import getJSON from './getJSON';
import Table from './Table';

TestJS();
getJSON('', (data) => {
    console.log(data);
});

getJSON('http://localhost:8000/api/v1/cities',
    (err, records) => {
        if (err !== null) {
            alert(`Something went wrong: ${err}`);
        } else {
            const table = document.querySelector('table');
            const data = Object.keys((records.data[0]));
            const dataRecords = records.data;

            Table.generateTableHead(table, data);
            Table.generateTable(table, dataRecords);
        }
    });
ConsoleLogIt('this workeds  in the bundle');
