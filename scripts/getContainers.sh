ssh -i $2 $1@$3 <<'ENDSSH'
nc -i 1 -n 127.0.0.1 12345 <<EOF
GET /containers/json HTTP/1.0

EOF
ENDSSH
