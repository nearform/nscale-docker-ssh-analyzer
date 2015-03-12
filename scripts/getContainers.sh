ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o BatchMode=yes -o ConnectTimeout=10 -t -i "$2" "$1@$3" <<'ENDSSH'
echo -e "GET /containers/json HTTP/1.0\r\n" | nc -U /var/run/docker.sock

ENDSSH
