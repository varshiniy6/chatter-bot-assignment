import React, {useContext, useState, useEffect, useCallback} from 'react'
import io from 'socket.io-client'
import useSound from 'use-sound'
import config from '../../../config'
import LatestMessagesContext from '../../../contexts/LatestMessages/LatestMessages'
import TypingMessage from './TypingMessage'
import InitialBotMessage from '../../../common/constants/initialBottyMessage'
import Header from './Header'
import Footer from './Footer'
import Message from './Message'
import '../styles/_messages.scss'

const socket = io(config.BOT_SERVER_ENDPOINT, {
  transports: ['websocket', 'polling', 'flashsocket'],
})

const InitialMessage = {
  id: Date.now(),
  message: InitialBotMessage,
  user: 'bot',
}

function scrollToBottomMessage() {
  const messages = document.getElementById('message-list')

  messages.scrollTo({top: messages.scrollHeight, behavior: 'smooth'})
}

function Messages() {
  const [playSend] = useSound(config.SEND_AUDIO_URL)
  const [playReceive] = useSound(config.RECEIVE_AUDIO_URL)
  const {setLatestMessage} = useContext(LatestMessagesContext)

  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([InitialMessage])
  const [typing, setTyping] = useState(false)

  //initial render cases
  useEffect(() => {
    document.getElementById('user-message-input').focus()
    socket.on('bot-typing', () => {
      setTyping(true)
      scrollToBottomMessage()
    })
  }, [])

  //incoming messages from bot
  useEffect(() => {
    //listen incoming messages
    socket.on('bot-message', message => {
      setTyping(false)

      setMessages([...messages, {message, user: 'bot', id: Date.now()}])
      setLatestMessage('bot', message)
      playReceive()
      scrollToBottomMessage()
    })
  }, [messages])

  //outgoing message to bot from user; used useCallback for optimization
  const sendMessage = useCallback(() => {
    if (!message) return

    setMessages([...messages, {message, user: 'me', id: Date.now()}])
    playSend()
    scrollToBottomMessage()

    socket.emit('user-message', message)

    document.getElementById('user-message-input').value = ''
    setMessage('')
  }, [messages, message])

  const onChangeMessage = ({target: {value}}) => {
    setMessage(value)
  }

  return (
    <div className="messages">
      <Header />
      <div className="messages__list" id="message-list">
        {messages.map((message, index) => (
          <Message
            message={message}
            nextMessage={messages[index + 1]}
            botTyping={typing}
          />
        ))}
        {typing && <TypingMessage />}
      </div>
      <Footer
        message={message}
        sendMessage={sendMessage}
        onChangeMessage={onChangeMessage}
      />
    </div>
  )
}

export default Messages
