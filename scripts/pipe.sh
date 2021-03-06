ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o BatchMode=yes -o ConnectTimeout=10 -T -i "$2" "$1@$3" <<'ENDSSH'
PIPE_IN="/tmp/piper-pipe-in"
PIPE_OUT="/tmp/piper-pipe-out"
rm $PIPE_IN &> /dev/null
rm $PIPE_OUT &> /dev/null
mkfifo $PIPE_IN
mkfifo $PIPE_OUT
PID1=-1
PID2=-1
RUNNING=true
echo --ready--
  nc -l -n 127.0.0.1 12345 > $PIPE_IN < $PIPE_OUT &
  PID1=$!
  nc -U /var/run/docker.sock < $PIPE_IN > $PIPE_OUT &
  PID2=$!
  wait $PID1 $PID2 2> /dev/null
echo --done--
ENDSSH

