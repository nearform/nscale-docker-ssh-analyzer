ssh -T -i "$2" "$1@$3" <<'ENDSSH'
echo -e "GET /images/json HTTP/1.0\r\n" | nc -U /var/run/docker.sock

ENDSSH
