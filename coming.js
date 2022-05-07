var baglan_button = document.getElementById("baglan");
var transfer_button = document.getElementById("transfer");
var deposit_button = document.getElementById("deposit");

var contract;
var wallet;
var near;
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
    }

}


load().then(async () => {
    await list_stream().then( async () =>{
        await get_balance();
        await getStreamId();
    })

});

async function withdraw_stream_func(stream_id){
    var response = await contract_dcversus.withdraw({
        "stream_ids" : [stream_id]
    },
    "100000000000000",
    "1")
    console.log(response);
}

async function get_balance(){
    var balance = await contract_wrap.ft_balance_of({
        "account_id": wallet.getAccountId()
    })
    document.getElementById("balance").innerHTML=nearApi.utils.format.formatNearAmount(balance);
}

async function getStreamId() {
    document.onclick = function (e) {
        
        if (e.target.tagName == "BUTTON") {
            var stream_id = e.target.getAttribute("stream_id");
            var stream_status = e.target.getAttribute("stream_code");
            if(stream_status == "active"){
                withdraw_stream_func(stream_id);
            }
            
        }
    }
}

async function list_stream(){
    var data = await contract_dcversus.get_account_incoming_streams({
        "account_id": wallet.getAccountId(),
        "from": 0,
        "limit": 100
    })
    const stream_list = document.getElementById("stream_list_div");
    var html = "";

    console.log(data);

    for(i in data){
    html = 
        `
        <tr>
            <th scope="row">${i}</th>
            <td>${data[i].id}</td>
            <td>${data[i].creator_id}</td>
            <td>${nearApi.utils.format.formatNearAmount(data[i].balance)}</td>
            <td>${data[i].status}</td>

            <td>${nearApi.utils.format.formatNearAmount(data[i].tokens_per_sec)}</td>
            <td>${nearApi.utils.format.formatNearAmount(data[i].tokens_total_withdrawn )}</td>


            <td>
            <button class="btn btn-warning btn-lg" id="button_stream-${data[i].id}" stream_id="${data[i].id}" stream_code="active">withdraw</button>
            
            </td>
        </tr>
        `
        stream_list.insertAdjacentHTML("beforeend", html);
    }

    

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
baglan_button.addEventListener('click', async  () => {
    console.log(wallet);
    if (!wallet.isSignedIn()) {
        wallet.requestSignIn(
            "dev-1651111427025-71600221442385" // contract address
        );
    } else {
        wallet.signOut();
        baglan_button.textContent = "sign in";
        location.reload();
    }
});

