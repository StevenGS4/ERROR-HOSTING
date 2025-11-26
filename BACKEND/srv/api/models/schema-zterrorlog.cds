namespace err.sch;

using { cuid, managed } from '@sap/cds/common';

type Status : String(20) enum {
  NEW;
  IN_PROGRESS;
  RESOLVED;
  IGNORED;
}

type Severity : String(10) enum {
  INFO;
  WARNING;
  ERROR;
  CRITICAL;
}

entity zterrorlog : cuid, managed {

  // =====================================================================================
  // CAMPOS ORIGINALES
  // =====================================================================================

  ERRORMESSAGE  : String(2000) not null;
  ERRORDATETIME : DateTime not null @cds.on.insert: $now;
  ERRORCODE     : String(500) not null;
  ERRORSOURCE   : String(500) not null;

  AI_REQUESTED  : Boolean default false;
  AI_RESPONSE   : String(5000);

  STATUS        : Status default 'NEW';
  SEVERITY      : Severity;
  TYPE_ERROR    : String(40);


  CONTEXT       : LargeString;

  MODULE        : String not null;
  APPLICATION   : String not null;

  CREATED_BY_APP : String not null;

  // =====================================================================================
  // 🆕 NUEVOS CAMPOS AGREGADOS (no se borró nada previo)
  // =====================================================================================

  ERRORID        : Integer;

  CANSEEUSERS    : array of String(255);
  ASIGNEDUSERS   : array of String(255);

  RESOLVEDBY     : String(255);
  RESOLVED_DATE  : DateTime;

  COMMENTS       : LargeString;
  FINALSOLUTION  : String(5000);

  USER_SESSION_LOG : array of String(255);

  PROCESS        : String(500);
  ENVIRONMENT    : String(20) default 'DEV';
  DEVICE         : String(50);
}
