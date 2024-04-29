const axios = require('axios');
const crypto = require('crypto');
const moment = require('moment');
require('dotenv').config();

// Function to create a signature for OKX API request
function createSignature(timestamp, method, requestPath, body, secretKey) {
    const prehash = timestamp + method + requestPath + (body ? JSON.stringify(body) : '');
    return crypto.createHmac('sha256', secretKey).update(prehash).digest('base64');
}

// Function to send a limit buy order
async function sendLimitBuyOrder(apiKey, secretKey, passphrase, symbol, price, quantity) {
    const baseUrl = 'https://www.okx.com';
    const endpoint = '/api/v5/trade/order';
    const method = 'POST';
    const timestamp = new Date().toISOString();

    const body = {
        instId: symbol,    // Instrument ID, e.g., 'ARTYUSDT'
        tdMode: 'cash',    // Trading mode
        side: 'buy',       // Order side
        ordType: 'limit',  // Order type
        px: price.toString(),     // Price
        sz: quantity.toString(),  // Size
    };

    const signature = createSignature(timestamp, method, endpoint, body, secretKey);

    const headers = {
        'OK-ACCESS-KEY': apiKey,
        'OK-ACCESS-SIGN': signature,
        'OK-ACCESS-TIMESTAMP': timestamp,
        'OK-ACCESS-PASSPHRASE': passphrase,
        'Content-Type': 'application/json',
    };

    try {
        const response = await axios.post(baseUrl + endpoint, body, { headers });
        return response.data
    } catch (error) {
        console.error('Error placing order:', error);
    }
}


const ARTY_TIME = 1703159999400; 
let alreadyBought = false;
let buyResult;
const main = async () => {
    if(alreadyBought) return
    const currentTime = moment.utc(new Date().getTime()).toDate().getTime()
    if(currentTime > ARTY_TIME){
        buyResult = await sendLimitBuyOrder(
            process.env.OKX_KEY,
            process.env.OKX_SECRET,
            process.env.OKX_PASS,
            "ARTY-USDT",
            "0.75", //price
            "480" //qty: ARTY amount = (qty * price)USDT
        )
        if(buyResult?.code === '0'){
            alreadyBought = true;
            console.log("BUY result: ", buyResult)
            return buyResult
        }else {
            console.log("FAILED ERRR:", buyResult)
        }
    }else{ 
        console.log("Currennt time::", new Date(currentTime).toString())
    }
}

let interval = setInterval( async () => {
    const finalTrade = await main()
    if(finalTrade){
        clearInterval(interval)
    }
}, 10);
