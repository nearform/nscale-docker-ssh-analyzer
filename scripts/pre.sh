ssh -t -i "$2" "$1@$3" <<'ENDSSH'
echo --ready--

ENDSSH
