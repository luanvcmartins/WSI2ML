# syntax=docker/dockerfile:1

FROM python:3.6
COPY requirements.txt requirements.txt
RUN apt-get update
RUN apt-get install openslide-tools --assume-yes
RUN pip3 install -r requirements.txt
COPY . .
CMD [ "python3", "app.py", "docker"]