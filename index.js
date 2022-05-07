   // connect to NEAR
   const near = new nearApi.Near({
    keyStore: new nearApi.keyStores.BrowserLocalStorageKeyStore(),
    networkId: 'testnet',
    nodeUrl: 'https://rpc.testnet.near.org',
    walletUrl: 'https://wallet.testnet.near.org'
  });
  
  // connect to the NEAR Wallet
  const wallet = new nearApi.WalletConnection(near, 'my-app');

  // connect to a NEAR smart contract
  const contract = new nearApi.Contract(wallet.account(), 'dev-1651748773977-98851007163198', {
    viewMethods: ['getMessages'],
    changeMethods: ['addMessage']
  });

  const button = document.getElementById('add-text');
  if (!wallet.isSignedIn()) {
    button.textContent = 'SignIn with NEAR'
  }

  // call the getMessages view method
  contract.getMessages()
    .then(messages => {
      const ul = document.getElementById('messages');
      const li = document.createElement('li');
      li.textContent = `${messages}`;
      ul.appendChild(li);

    });

  // Either sign in or call the addMessage change method on button click
  document.getElementById('add-text').addEventListener('click', async () => {
    if (wallet.isSignedIn()) {
      var respond = await contract.addMessage({
        args: { message: document.getElementById('message_text').value },
        //amount: nearApi.utils.format.parseNearAmount('1')
      })
      console.log(respond);
      await location.reload();
    } else {
      wallet.requestSignIn({
        contractId: 'dev-1651748773977-98851007163198',
        methodNames: ['getMessages', 'addMessage']
      });
    }
  });