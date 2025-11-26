import cds from '@sap/cds';
import { crudErrores } from '../services/crud-service.js';

class ErrorClass extends cds.ApplicationService {
  async init() {
    this.on('crud', async (req) => {
      const queryParams = req.req.query;
      const { body } = req.req;

      const result = await crudErrores(queryParams, body);
      
      req.http.res.status(result.status || 200);
      return req.http.res.send(result);
    });
  }
}

export default ErrorClass;
