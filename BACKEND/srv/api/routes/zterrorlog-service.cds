using { err.sch as err } from '../models/schema-zterrorlog';

@impl: 'srv/api/controllers/zterrorlog-controller.js'

service ZterrorLogServiceRoute @(path: 'api/error') {
  entity ErrSrv as projection on err.zterrorlog;

  // @Core.Description: 'get-all-errors'
  // @path            : 'getall'
  // function getall()                 returns array of ErrSrv;

  // @Core.Description: 'get-one-error'
  // @path            : 'getone'
  // action   getOne(_id: String)      returns array of ErrSrv;

  // @Core.Description: 'addOne-error'
  // @path            : 'addOne'
  // action   addOne(error: ErrSrv)    returns array of ErrSrv;

  @Core.Description: 'crud-error'
  @path            : 'crud'
  action crud(data : LargeString) returns array of ErrSrv;

  // @Core.Description: 'deleteOne-error'
  // @path            : 'deleteOne'
  // action deleteOne(error: ErrSrv) returns array of ErrSrv;

  // @Core.Description: 'updateOne-error'
  // @path            : 'updateOne'
  // action updateOne(error: ErrSrv) returns array of ErrSrv;
}
