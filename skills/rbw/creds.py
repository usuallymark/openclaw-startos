"""Credential lookup for OpenClaw skills.

    import sys; sys.path.insert(0, '/opt/skills/rbw')
    from creds import auth_headers, getcred
    hdrs = auth_headers('X-N8N-API-KEY', 'N8N_KEY')                # raises if not configured
    hdrs = auth_headers('X-API-KEY', 'STIRLING_KEY', required=False)  # {} if not configured
    getcred('N8N_KEY')                       # the raw value, if a header won't do

Works for both "Enter manually" (plain env var) and "Fetch from Vaultwarden"
(<VAR>_FROM_VAULT pointer, resolved with rbw by /usr/local/bin/getcred).
Never print or store the returned value. Don't assign it to a variable whose
name ends in KEY, TOKEN, SECRET or PASSWORD in code you show or copy: OpenClaw
redacts such lines in tool output, which breaks code copied from it.
"""

import os
import subprocess

_GETCRED = '/usr/local/bin/getcred' if os.path.exists('/usr/local/bin/getcred') else 'getcred'


class CredentialError(RuntimeError):
    pass


def auth_headers(header, var, required=True, prefix=''):
    """{header: prefix + credential}, or {} if optional and not configured.

    Lets skill code send a credential without ever naming it in a variable.
    """
    value = getcred(var, required=required)
    return {header: prefix + value} if value else {}


def getcred(var, required=True):
    r = subprocess.run([_GETCRED, var], capture_output=True, text=True)
    if r.returncode != 0:
        if not required and 'is not configured' in r.stderr:
            return ''
        raise CredentialError(r.stderr.strip() or f'{var} is not available')
    return r.stdout
