/**
  This is a helper class for mocking asynchronous calls for the Mock Bitcoin 
  Client.    
  
  @author Liam Clancy <liameclancy@gmail.com>
*/
export default class MockStream {

  /**
    Construct a new instance of a Mock Stream.

    @param _json The JSON object to wrap.
  */
  constructor ( 
    _json 
  ) {
    this.internalJSON = _json;
  };

  // Return the passed JSON wrapped in a promise.
  async json () {
    return this.internalJSON;
  };
};