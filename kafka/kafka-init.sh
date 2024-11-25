#!/bin/bash
# Kafka 초기화 스크립트

sleep 10  # Kafka가 시작될 시간을 확보

TOPIC_NAME="my-topic"

# 토픽 존재 여부 확인
EXISTING_TOPIC=$(kafka-topics --bootstrap-server kafka:29092 --list | grep "^${TOPIC_NAME}$")
echo "checking topic list..."
if [ -n "$EXISTING_TOPIC" ]; then
  echo "Topic '${TOPIC_NAME}' already exists."
else
  echo "Creating topic '${TOPIC_NAME}'..."
  kafka-topics --create \
    --topic $TOPIC_NAME \
    --bootstrap-server kafka:29092 \
    --partitions 3 \
    --replication-factor 1
  echo "Topic '${TOPIC_NAME}' created."
fi
