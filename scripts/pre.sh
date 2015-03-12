ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o BatchMode=yes -o ConnectTimeout=10 -t -i "$2" "$1@$3" <<'ENDSSH'
echo --ready--

ENDSSH
