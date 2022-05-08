var baglan_button = document.getElementById("baglan");
var deposit_button = document.getElementById("deposit");
var transfer_button = document.getElementById("transfer");

var contract;
var wallet;
var near;
var connected_account;
async function load() {
    /* connect near */
    var near = await new nearApi.Near({
        keyStore: new nearApi.keyStores.BrowserLocalStorageKeyStore(),
        networkId: 'testnet',
        nodeUrl: 'https://rpc.testnet.near.org',
        walletUrl: 'https://wallet.testnet.near.org'
    });
    // connect to the NEAR Wallet
    wallet = new nearApi.WalletConnection(near, 'donate');
    // connect to a NEAR smart contract streaming-r-v2.dcversus.testnet
    contract_wrap = new nearApi.Contract(wallet.account(), 'wrap.testnet', {
        viewMethods: ['ft_balance_of'],
        changeMethods: ['ft_transfer_call', 'ft_transfer', 'start_stream', 'pause_stream', 'stop_stream', 'withdraw', 'near_deposit']
    });

    contract_dcversus = new nearApi.Contract(wallet.account(), 'streaming-r-v2.dcversus.testnet', {
        viewMethods: ['get_stats', 'get_stream', 'get_account', 'get_account_incoming_streams', 'get_account_outgoing_streams'],
        changeMethods: ['start_stream', 'pause_stream', 'stop_stream', 'withdraw']
    });
    
    if (wallet.isSignedIn()) {
        baglan_button.textContent = 'sign out   ' + wallet.getAccountId();
        connected_account = wallet.getAccountId();
    }

}


load().then(async () => {
    if(connected_account != undefined){
        await list_stream().then( async () =>{
            await get_balance();
            await getStreamId();
        })
    }


});

async function get_balance(){
    var balance = await contract_wrap.ft_balance_of({
        "account_id": wallet.getAccountId()
    })
    document.getElementById("balance").innerHTML=nearApi.utils.format.formatNearAmount(balance);
}
async function get_stream_id(){
    var last_created_stream_id = await contract_dcversus.get_account({
        "account_id": wallet.getAccountId()
    })
    return last_created_stream_id.last_created_stream
}

async function stop_stream_func(stream_id){
    var response = await contract_dcversus.stop_stream({
        "stream_id" : stream_id
    },
    "100000000000000",
    "1")
    console.log(response);
}
async function pause_stream_func(stream_id){
    var response = await contract_dcversus.pause_stream({
        "stream_id" : stream_id
    },
    "100000000000000",
    "1")
    console.log(response);
}
async function start_stream_func(stream_id){
    var response = await contract_dcversus.start_stream({
        "stream_id" : stream_id
    },
    "100000000000000",
    "1")
    console.log(response);
}

async function getStreamId() {
    document.onclick = function (e) {
        
        if (e.target.tagName == "BUTTON") {
            var stream_id = e.target.getAttribute("stream_id");
            var stream_status = e.target.getAttribute("stream_code");
            if(stream_status == "active"){
                pause_stream_func(stream_id);
            } 
            if(stream_status == "passive"){ 
                start_stream_func(stream_id);
            }
            if(stream_status == "stop"){ 
                stop_stream_func(stream_id);
            }

        }
    }
}

async function list_stream(){
    var data = await contract_dcversus.get_account_outgoing_streams({
        "account_id": wallet.getAccountId(),
        "from": 0,
        "limit": 100
    })
    const stream_list = document.getElementById("stream_list_div");
    var table_head = `
    <table class="table">
    <thead>
      <tr>
        <th scope="col">#</th>
        <th scope="col">id</th>
        <th scope="col">owner</th>
        <th scope="col">receiver</th>
        <th scope="col">balance</th>
        <th scope="col">status</th>
        <th scope="col">action</th>
      </tr>
    </thead>
    <tbody>
    `
    var table_footer = `
    </tbody></table>
    `
    var html = "";
    var button = "";
    for(i in data){
        if(data[i].status == "Active"){
            button = `<button class="btn btn-warning btn-lg" id="button_stream-${data[i].id}" stream_id="${data[i].id}" stream_code="active">Pause Stream</button>`
        } else {
            button = `<button class="btn btn-success btn-lg" id="button_stream-${data[i].id}" stream_id="${data[i].id}" stream_code="passive">Start Stream</button>
                      <button class="btn btn-danger btn-lg"  id="button_stream-${data[i].id}" stream_id="${data[i].id}" stream_code="stop">Stop Stream</button>` 
        }
        html += 
        `
        <tr>
            <th scope="row">${i}</th>
            <td>${data[i].id}</td>
            <td>${data[i].owner_id}</td>
            <td>${data[i].receiver_id}</td>
            <td>${nearApi.utils.format.formatNearAmount(data[i].balance)}</td>
            <td>${data[i].status}</td>
            <td>
            ${button }
            
            </td>
        </tr>
        `
        
    }

    stream_list.insertAdjacentHTML("beforeend", table_head + html + table_footer);

}

deposit_button.addEventListener('click', async () => {
    


    if(document.getElementById("deposit_amount").value == ""){
        alert("please fill deposit amount");
    } else {
        var response = await contract_wrap.near_deposit({}, 
            "300000000000000", 
            nearApi.utils.format.parseNearAmount(document.getElementById("deposit_amount").value)
            );
        console.log(response);
    }

})

transfer_button.addEventListener('click', async () => {
    var varn = 0;
    if(document.getElementById("transfer_amount").value == ""){
        varn = 1;
        alert("please fill transfer amount");
    }
    if(document.getElementById("receiver_account").value == ""){
        varn = 1;
        alert("please fill receiver_account");
    }
    if(document.getElementById("tokens_per_sec").value == ""){
        varn = 1;
        alert("please fill receiver_account");
    }
    if(varn == 0){
        var response = await contract_wrap.ft_transfer_call({
            receiver_id: 'streaming-r-v2.dcversus.testnet',
            amount: nearApi.utils.format.parseNearAmount(document.getElementById("transfer_amount").value), // 1 NEAR
            memo: document.getElementById("memo").value,
            msg: JSON.stringify({
                Create: {
                    request: {
                        "owner_id": wallet.getAccountId(),
                        "receiver_id": document.getElementById("receiver_account").value,
                        "tokens_per_sec": parseInt(document.getElementById("tokens_per_sec").value), // 1 month for 1 NEAR
                    }
                }
            }),
        }, 
        "100000000000000",
        "1"
        );
    }
})

baglan_button.addEventListener('click', async function () {
    console.log(wallet);
    if (!wallet.isSignedIn()) {
        wallet.requestSignIn(
            "wrap.testnet" // contract address
        );
    } else {
        wallet.signOut();
        baglan_button.textContent = "sign in";
        location.reload();
    }
});
