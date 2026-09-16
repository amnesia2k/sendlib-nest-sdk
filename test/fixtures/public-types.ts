import type * as NodeSdk from '@sendlib/node-sdk';

import type * as NestSdk from '../../src/index.js';

type Same<Left, Right> = [Left] extends [Right] ? ([Right] extends [Left] ? true : false) : false;

type EveryTrue<Values extends readonly true[]> = Values;

/** Compile-time proof that Nest re-exports the canonical Node SDK types unchanged. */
export type NodeTypeReexports = EveryTrue<
  [
    Same<NestSdk.Attachment, NodeSdk.Attachment>,
    Same<NestSdk.BatchRecipient, NodeSdk.BatchRecipient>,
    Same<NestSdk.BatchRecipientResult, NodeSdk.BatchRecipientResult>,
    Same<NestSdk.BatchRecipientStatus, NodeSdk.BatchRecipientStatus>,
    Same<NestSdk.BatchStatus, NodeSdk.BatchStatus>,
    Same<NestSdk.BatchStatusResponse, NodeSdk.BatchStatusResponse>,
    Same<NestSdk.BatchVariables, NodeSdk.BatchVariables>,
    Same<NestSdk.CreateBatchInput, NodeSdk.CreateBatchInput>,
    Same<NestSdk.CreateBatchResponse, NodeSdk.CreateBatchResponse>,
    Same<NestSdk.CustomEmailInput, NodeSdk.CustomEmailInput>,
    Same<NestSdk.DeliverabilityField, NodeSdk.DeliverabilityField>,
    Same<NestSdk.DeliverabilityInput, NodeSdk.DeliverabilityInput>,
    Same<NestSdk.DeliverabilityIssue, NodeSdk.DeliverabilityIssue>,
    Same<NestSdk.DeliverabilityIssueCode, NodeSdk.DeliverabilityIssueCode>,
    Same<NestSdk.DeliverabilityManualCheck, NodeSdk.DeliverabilityManualCheck>,
    Same<NestSdk.DeliverabilityManualCheckCode, NodeSdk.DeliverabilityManualCheckCode>,
    Same<NestSdk.DeliverabilityReport, NodeSdk.DeliverabilityReport>,
    Same<NestSdk.EmailAddress, NodeSdk.EmailAddress>,
    Same<NestSdk.EmailRecipient, NodeSdk.EmailRecipient>,
    Same<NestSdk.KnownBatchRecipientStatus, NodeSdk.KnownBatchRecipientStatus>,
    Same<NestSdk.SendEmailDebug, NodeSdk.SendEmailDebug>,
    Same<NestSdk.SendEmailInput, NodeSdk.SendEmailInput>,
    Same<NestSdk.SendEmailResponse, NodeSdk.SendEmailResponse>,
    Same<NestSdk.SendlibApiErrorOptions, NodeSdk.SendlibApiErrorOptions>,
    Same<NestSdk.SendlibAuthMode, NodeSdk.SendlibAuthMode>,
    Same<NestSdk.SendlibBatches, NodeSdk.SendlibBatches>,
    Same<NestSdk.SendlibCallOptions, NodeSdk.SendlibCallOptions>,
    Same<NestSdk.SendlibDeliverability, NodeSdk.SendlibDeliverability>,
    Same<NestSdk.SendlibEmails, NodeSdk.SendlibEmails>,
    Same<NestSdk.SendlibFetch, NodeSdk.SendlibFetch>,
    Same<NestSdk.SendlibOptions, NodeSdk.SendlibOptions>,
    Same<NestSdk.SendlibTemplates, NodeSdk.SendlibTemplates>,
    Same<NestSdk.TemplateData, NodeSdk.TemplateData>,
    Same<NestSdk.TemplateEmailInput, NodeSdk.TemplateEmailInput>,
    Same<NestSdk.TemplateSendInput, NodeSdk.TemplateSendInput>,
    Same<NestSdk.WaitForBatchOptions, NodeSdk.WaitForBatchOptions>,
  ]
>;
