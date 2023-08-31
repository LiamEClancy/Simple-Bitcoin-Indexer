// Imports.
import MockStream from './MockStream.js';

/**
  This is a Mock RPC client for communicating with a Bitcoin RPC server.    
  
  @author Liam Clancy <liameclancy@gmail.com>
*/
export default class MockBitcoinClient {

  /**
    Construct a new instance of a Bitcoin RPC client.

    @param _url The RPC server URL.
    @param _user The username of the RPC user.
    @param _password  The password of the RPC user.
    @param _port The port the RPC server is running on.
  */
  constructor ({ 
    _url,
    _user,
    _password,
    _port
  }) {
    this.url = _url;
    this.port = _port;

    // Synthesized global state from environment configuration.
    this.credentials = btoa(`${_user}:${_password}`);
  };

  /**
    Perform an RPC call to the configured Bitcoin RPC API.

    @param _method The RPC method to call.
    @param _parameters Parameters with which to call `_method`.

    @returns A promise representing the pending request to the RPC API.
  */
  async call (
    _method,
    _parameters
  ) {
    switch (_method) {
      case 'getblockcount':
        return new MockStream({
          'result':800000,
          'error':null,
          'id':'curltest'
        });

      case 'getblockhash':
        return new MockStream({
          'result':'00000000000000000002a7c4c1e48d76c5a37902165a270156b7a8d72728a054',
          'error':null,
          'id':'curltest'
        });

      case 'getblock':
        return new MockStream({
          'result':{
            'hash':'00000000000000000002a7c4c1e48d76c5a37902165a270156b7a8d72728a054',
            'confirmations':3060,
            'height':800000,
            'version':874340352,
            'versionHex':'341d6000',
            'merkleroot':'91f01a00530c8c83617190048ea8b0814d506cf24dfdbcf8893f8f0cab7f0855',
            'time':1690168629,
            'mediantime':1690165851,
            'nonce':106861918,
            'bits':'17053894',
            'difficulty':53911173001054.59,
            'chainwork':'00000000000000000000000000000000000000004fc85ab3390629e495bf13d5',
            'nTx':2,
            'previousblockhash':'000000000000000000012117ad9f72c1c0e42227c2d042dca23e6b96bd9fbb55',
            'nextblockhash':'00000000000000000000e26b239cf19ec7ace5edd9694d51a3f6933247720947',
            'strippedsize':786115,
            'size':1634536,
            'weight':3992881,
            'tx':[
              'b75ca3106ed100521aa50e3ec267a06431c6319538898b25e1b757a5736f5fb4',
              'd41f5de48325e79070ccd3a23005f7a3b405f3ce1faa4df09f6d71770497e9d5'
            ]
          },
          'error':null,
          'id':'curltest'
        });

      case 'getrawtransaction':
        if (_parameters[0] === 'b75ca3106ed100521aa50e3ec267a06431c6319538898b25e1b757a5736f5fb4') {
          return new MockStream({
            'result': {
              'in_active_chain':true,
              'txid':'b75ca3106ed100521aa50e3ec267a06431c6319538898b25e1b757a5736f5fb4',
              'hash':'4f684e6a3456df6e321ead86e56d37697340d81174e3da641846b3e23ff962a3',
              'version':1,
              'size':192,
              'vsize':165,
              'weight':660,
              'locktime':0,
              'vin':[
                {
                  'coinbase':'0300350c0120130909092009092009102cda1492140000000000',
                  'txinwitness':['0000000000000000000000000000000000000000000000000000000000000000'],
                  'sequence':4294967295
                }
              ],
              'vout':[
                {
                  'value':6.38687680,
                  'n':0,
                  'scriptPubKey':{
                    'asm':'OP_HASH160 c3f8f898ae5cab4f4c1d597ecb0f3a81a9b146c3 OP_EQUAL',
                    'desc':'addr(3KZDwmJHB6QJ13QPXHaW7SS3yTESFPZoxb)#xqh9j2g0',
                    'hex':'a914c3f8f898ae5cab4f4c1d597ecb0f3a81a9b146c387',
                    'address':'3KZDwmJHB6QJ13QPXHaW7SS3yTESFPZoxb',
                    'type':'scripthash'
                  }
                },
                {
                  'value':0.00000000,
                  'n':1,
                  'scriptPubKey':{
                    'asm':'OP_RETURN aa21a9ed9fbe517a588ccaca585a868f3cf19cb6897e3c26f3351361fb28ac8509e69a7e',
                    'desc':'raw(6a24aa21a9ed9fbe517a588ccaca585a868f3cf19cb6897e3c26f3351361fb28ac8509e69a7e)#v27rwy9x',
                    'hex':'6a24aa21a9ed9fbe517a588ccaca585a868f3cf19cb6897e3c26f3351361fb28ac8509e69a7e',
                    'type':'nulldata'
                  }
                }
              ],
              'hex':'010000000001010000000000000000000000000000000000000000000000000000000000000000ffffffff1a0300350c0120130909092009092009102cda1492140000000000ffffffff02c09911260000000017a914c3f8f898ae5cab4f4c1d597ecb0f3a81a9b146c3870000000000000000266a24aa21a9ed9fbe517a588ccaca585a868f3cf19cb6897e3c26f3351361fb28ac8509e69a7e0120000000000000000000000000000000000000000000000000000000000000000000000000',
              'blockhash':'00000000000000000002a7c4c1e48d76c5a37902165a270156b7a8d72728a054',
              'confirmations':3057,
              'time':1690168629,
              'blocktime':1690168629
            },
            'error':null,
            'id':'curltest'
          });
        } else {
          return new MockStream({
            'result': {
              'in_active_chain':true,
              'txid':'d41f5de48325e79070ccd3a23005f7a3b405f3ce1faa4df09f6d71770497e9d5',
              'hash':'94574a056707bda53ab7e08ddef0ca29100cb42647f5f76b3877cc8f4b694b56',
              'version':2,
              'size':235,
              'vsize':153,
              'weight':610,
              'locktime':0,
              'vin': [
                {
                  'txid':'a992dbddbeb7382e3defc6914f970ea769ef813e69a923afa336976f2cbf0465',
                  'vout':1,
                  'scriptSig':{
                    'asm':'',
                    'hex':''
                  },
                  'txinwitness':[
                    '3045022100f404e977e0a3dee1e9da7708db6ce6f3cbe80e6ffbbb6364bd2c725af200520a02201faca96001ac7f82fcea71e03b29deeaac6525c3bb8abe3b3c64544af16b698501',
                    '025b1b8e6cd2ebc837fc57928c688b9b4d192f9001d03d1831510a6e511ca3fa5e'
                  ],
                  'sequence':4294967295
                }
              ],
              'vout': [
                {
                  'value':0.00143332,
                  'n':0,
                  'scriptPubKey':{
                    'asm':'1 2d618c1f73d5133fdc97d545bfbf55b4cba2ab2a9d41e4596b1df6b8ea9d9348',
                    'desc':'rawtr(2d618c1f73d5133fdc97d545bfbf55b4cba2ab2a9d41e4596b1df6b8ea9d9348)#qcfssy75',
                    'hex':'51202d618c1f73d5133fdc97d545bfbf55b4cba2ab2a9d41e4596b1df6b8ea9d9348',
                    'address':'bc1p94scc8mn65fnlhyh64zml064kn9692e2n4q7gkttrhmt365ajdyq0m2mzh',
                    'type':'witness_v1_taproot'
                  }
                },
                {
                  'value':0.00291851,
                  'n':1,
                  'scriptPubKey':{
                    'asm':'0 64dbbc84f12f32699ca5010faa618d6a25559b6f',
                    'desc':'addr(bc1qvndmep839uexn899qy865cvddgj4txm0nkjua9)#mv9fkx23',
                    'hex':'001464dbbc84f12f32699ca5010faa618d6a25559b6f',
                    'address':'bc1qvndmep839uexn899qy865cvddgj4txm0nkjua9',
                    'type':'witness_v0_keyhash'
                  }
                }
              ],
              'hex':'020000000001016504bf2c6f9736a3af23a9693e81ef69a70e974f91c6ef3d2e38b7bedddb92a90100000000ffffffff02e42f0200000000002251202d618c1f73d5133fdc97d545bfbf55b4cba2ab2a9d41e4596b1df6b8ea9d93480b7404000000000016001464dbbc84f12f32699ca5010faa618d6a25559b6f02483045022100f404e977e0a3dee1e9da7708db6ce6f3cbe80e6ffbbb6364bd2c725af200520a02201faca96001ac7f82fcea71e03b29deeaac6525c3bb8abe3b3c64544af16b69850121025b1b8e6cd2ebc837fc57928c688b9b4d192f9001d03d1831510a6e511ca3fa5e00000000',
              'blockhash':'00000000000000000002a7c4c1e48d76c5a37902165a270156b7a8d72728a054',
              'confirmations':3058,
              'time':1690168629,
              'blocktime':1690168629
            },
            'error':null,
            'id':'curltest'
          });
        }

      default:
        return new MockStream({
          error: 'ERROR: Unsupported method.'
        });
    }
  }
};
