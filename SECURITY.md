# Security policy

## Supported versions

Before the first npm publication, security fixes are made on the default branch. After publication, only the latest release is supported unless a release notice says otherwise. During `0.x`, minor releases may contain breaking changes.

## Report a vulnerability privately

Do not open a public issue for a suspected vulnerability.

Use GitHub private vulnerability reporting for the repository or email `tilewa.olatoyee@gmail.com` with the subject `@sendlib/nest-sdk security report`.

Include the affected version, impact, reproduction steps, and a minimal sanitized proof of concept. Never include a real API key, authorization header, recipient, production message, or sensitive attachment. Revoke exposed credentials immediately.

## Scope

Credential exposure, unsafe option logging, injection-token confusion, package compromise, and dependency vulnerabilities in this adapter are in scope. Node SDK transport issues should also be checked against `@sendlib/node-sdk`. SendLib service, account, billing, and infrastructure issues belong with SendLib's official support channels.
