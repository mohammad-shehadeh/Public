<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Search Database</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f0f4f8;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            flex-direction: column;
        }
        #app {
            width: 60%;
            background-color: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
            text-align: center;
        }
        #app:hover {
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
        }
        #searchResults {
            font-size: 20px;
            margin-top: 20px;
            padding: 20px;
            background-color: #e9f5ff;
            border-radius: 10px;
            border: 2px solid #007bff;
            max-height: 300px;
            overflow-y: auto;
        }
        .entry {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-bottom: 20px;
            background-color: #ffffff;
            border: 2px solid #007bff;
            border-radius: 10px;
            padding: 15px;
            box-shadow: 0px 4px 12px rgba(0, 123, 255, 0.1);
        }
        .box {
            background-color: #007bff;
            color: white;
            padding: 10px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
        }
        input[type="file"], input[type="text"] {
            width: 100%;
            padding: 15px;
            margin: 10px 0;
            border-radius: 10px;
            border: 2px solid #007bff;
            font-size: 18px;
            box-sizing: border-box;
        }
        button {
            background-color: #007bff;
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 10px;
            cursor: pointer;
            font-size: 18px;
            font-weight: bold;
            transition: background-color 0.3s ease;
        }
        button:hover {
            background-color: #0056b3;
        }
        h2, h3 {
            color: #333;
            font-size: 28px;
        }
        #dateTime {
            margin-top: 10px;
            font-size: 18px;
            color: #666;
        }
        #credits {
            margin-top: 30px;
            font-size: 16px;
            color: #007bff;
        }
    </style>
</head>
<body>

<div id="app">
    <h2>Search Database Program</h2>
    <input type="file" id="fileInput" accept=".txt" placeholder="Select a text file">
    <input type="text" id="searchInput" placeholder="Type to search...">
    <div id="searchResults"></div>
    <div id="dateTime"></div>
    <div id="credits">Program created by Mohammed Shahada</div>
</div>

<script>
    let database = [];
    let selectedFile = localStorage.getItem('selectedFile') || '';

    // Load the file if it was previously selected
    if (selectedFile) {
        loadFile(selectedFile);
    }

    document.getElementById('fileInput').addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                selectedFile = e.target.result;
                localStorage.setItem('selectedFile', selectedFile);
                loadFile(selectedFile);
            };
            reader.readAsText(file);
        }
    });

    function loadFile(content) {
        database = content.split('\n').map(line => line.split('/'));
    }

    document.getElementById('searchInput').addEventListener('input', function() {
        const query = this.value.trim().toLowerCase().replace(/\s+/g, '');
        if (query === '') {
            document.getElementById('searchResults').innerHTML = ''; // Clear results if no input
        } else {
            const results = searchDatabase(query).slice(0, 3); // Show only top 3 results
            displayResults(results);
        }
    });

    function searchDatabase(query) {
        return database.filter(entry => {
            return entry.some(item => fuzzyMatch(item, query));
        });
    }

    function fuzzyMatch(str, query) {
        return str.toLowerCase().replace(/\s+/g, '').includes(query);
    }

    function displayResults(results) {
        const searchResults = document.getElementById('searchResults');
        searchResults.innerHTML = '';
        if (results.length === 0) {
            searchResults.innerHTML = '<p>No results found</p>';
        } else {
            results.forEach(entry => {
                const div = document.createElement('div');
                div.className = 'entry';
                entry.forEach(item => {
                    const box = document.createElement('div');
                    box.className = 'box';
                    box.textContent = item;
                    div.appendChild(box);
                });
                searchResults.appendChild(div);
            });
        }
    }

    // Function to display current date and time
    function updateDateTime() {
        const now = new Date();
        const dateTimeString = now.toLocaleString();
        document.getElementById('dateTime').textContent = 'Date & Time: ' + dateTimeString;
    }

    // Update date and time every second
    setInterval(updateDateTime, 1000);

</script>

</body>
</html>
