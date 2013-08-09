
cd "$( dirname "${BASH_SOURCE[0]}" )"
cd css

while true
do
	sleep .1
	echo "main.less compiled" $(date)
	lessc main.less main.css -x
	if [[ $? != 0 ]]
		then beep -f 200 -l 5
		sleep 1
	fi
done
