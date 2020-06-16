var bidTable = []

function generateTable(tableBody, data) {
    if (tableBody) {
        tableBody.innerHTML = '';
    }
    for (let element of data) {
        let row = tableBody.insertRow();
        row.setAttribute("id", element.name); // creating "Tr" element with id = name
        for (key in element) { //creating table data for each variable of object.
            if(key !=='midPriceArray'){ // for object midPriceArray sparkline will be created separately.
            let cell = row.insertCell(); // table data created.
            let text = document.createTextNode(element[key]);
            cell.appendChild(text); // variable value added in newly created  table data
        }}
        let cell = row.insertCell(); // new table data created for sparkline graph
        let SparklineText = document.createElement('span');
        SparklineText.setAttribute("id", element.name + '-sparkline');
        cell.appendChild(SparklineText); // span element added in table data.
        const exampleSparkline = document.getElementById(element.name + '-sparkline')
        const SparklineArray = Array.from(element.midPriceArray, x => x.price)
        Sparkline.draw(exampleSparkline, SparklineArray) // sparkline graph mapped with its ID.
    }
}
function checkValidity(midPriceObj) {
    const timeDiff = Math.abs(new Date().getTime() - midPriceObj.time.getTime()); // in miliseconds
    const timeDiffInSecond = Math.ceil(timeDiff / 1000); // in second
    return timeDiffInSecond < 30 // filtering midPriceArray whose value time is greater than 30 second.
}

var callback = function (message) {
    // called when the client receives a STOMP message from the server
    if (message.body) {
        const currencyPair = JSON.parse(message.body) // converting Json to object
        // creating midPrice object.
        const midPrice = {
            price: (currencyPair.bestBid + currencyPair.bestAsk) / 2,
            time: new Date()
        };
        currencyPair.midPriceArray = [midPrice]  // creating midPriceArray in order to draw sparkline
        const previousCurrencyPairIndex = bidTable.findIndex(x => x.name === currencyPair.name) // checking whether this aaray is already present or not
        if (previousCurrencyPairIndex >= 0) {
            currencyPair.midPriceArray.push(...bidTable[previousCurrencyPairIndex].midPriceArray) // merging midPricearray with new one.
            bidTable.splice(previousCurrencyPairIndex, 1);// deleting previous currency pair
        }
        currencyPair.midPriceArray = currencyPair.midPriceArray.filter(checkValidity); // filtering midPriceArray to have only midprice which is less than 30 second old.
        bidTable.push(currencyPair) // pushing in final bidTable
        // sorting bid table on basis of highest lastChangeBid
        bidTable.sort(function (a, b) {
            return b.lastChangeBid - a.lastChangeBid;
        });
        let tableBody = document.getElementById("bid-table-body");
        //generating table with bidTable
        generateTable(tableBody, bidTable);
    } else {
        alert("got empty message");
    }
};


function connectCallback() {
    document.getElementById('stomp-status').innerHTML = "It has now successfully connected to a stomp server serving price updates for some foreign exchange currency pairs."
    // subscribing "/fx/prices" to get regular biding prices.
    const subscription = client.subscribe("/fx/prices", callback, {id: 'bid'});
}


const url = "ws://localhost:8011/stomp"

const client = Stomp.client(url)
client.connect({}, connectCallback, function (error) {
    alert(error.headers.message)
})
