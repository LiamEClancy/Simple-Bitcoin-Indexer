// Imports.
import fetch from 'node-fetch';

/**
  This is an RPC client for communicating with a Bitcoin RPC server.    
  
  @author Liam Clancy <liameclancy@gmail.com>
*/
export default class BitcoinClient {

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
    return fetch(
      `${this.url}:${this.port}`,
      {
        method: 'POST',
        body: `{"jsonrpc":"1.0","id":"indexer","method":"${_method}","params":${JSON.stringify(_parameters)}}`,
        headers: {
          'Authorization': `Basic ${this.credentials}`
        }
      }
    );
  };
};
