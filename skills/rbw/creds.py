"""Credential lookup for OpenClaw skills.

    import sys; sys.path.insert(0, '/opt/skills/rbw')
    from creds import getcred
    key = getcred('N8N_KEY')                       # raises if not configured
    key = getcred('STIRLING_KEY', required=False)  # '' if not configured

Works for both "Enter manually" (plain env var) and "Fetch from Vaultwarden"
(<VAR>_FROM_VAULT pointer, resolved with rbw by /usr/local/bin/getcred).
Never print or store the returned value.
"""

import os
import subprocess

_GETCRED = '/usr/local/bin/getcred' if os.path.exists('/usr/local/bin/getcred') else 'getcred'


class CredentialError(RuntimeError):
    pass


def getcred(var, required=True):
    r = subprocess.run([_GETCRED, var], capture_output=True, text=True)
    if r.returncode != 0:
        if not required and 'is not configured' in r.stderr:
            return ''
        raise CredentialError(r.stderr.strip() or f'{var} is not available')
    return r.stdout
