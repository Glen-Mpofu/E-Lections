import { Pressable, StyleSheet, Text, TouchableOpacity, View, KeyboardAvoidingView, Platform, Image, useColorScheme } from 'react-native'
import React, { useEffect, useState } from 'react'
import ThemedText from '../components/ThemedText'
import ThemedView from '../components/ThemedView'
import ThemedTextInput from '../components/ThemedTextInput'
import { useRouter } from "expo-router"
import axios from "axios"
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/Colors'
import { Toast } from 'toastify-react-native';
import { BASE_URL } from "@env"

const Home = () => {
  const [studNumber, onStudNumberChange] = useState("")
  const [pin, onPinChange] = useState("")
  const router = useRouter()
  const baseUrl = "http://192.168.101.101:5002";
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light

  const [error, setError] = useState(theme.borderColor)
  const [passwordError, setPasswordError] = useState(theme.borderColor)

  async function handleLogin() {
    if (studNumber.length !== 9) {
      Toast.show({
        type: "error",
        text1: "The student number must be exactly 9 digits",
        useModal: false
      })
      setError(Colors.error)
      return;
    }
    setError(theme.borderColor)
    if (pin.length !== 3) {
      Toast.show({
        type: "error",
        text1: "The pin must be exactly 3 digits",
        useModal: false
      })
      setPasswordError(Colors.error)
      return;
    }

    setPasswordError(theme.borderColor)
    const studentData = { studNumber, pin }
    console.log(BASE_URL)
    try {
      const res = await axios.post(`${baseUrl}/getStudent`, { studentData }, { withCredentials: true })
      if (res.data.status === "ok") {
        await AsyncStorage.setItem("userToken", res.data.token)
        router.push("dashboard")
        Toast.show({
          type: "success",
          text1: "Login Successful",
          useModal: false
        })
      } else if (res.data.status === "passwordWrong") {
        Toast.show({
          type: "error",
          text1: res.data.data,
          useModal: false
        })
        setPasswordError(Colors.error)
      }
      else if (res.data.status === "notFromLajazz") {
        Toast.show({
          type: "error",
          text1: res.data.data,
          useModal: false
        })
        setError(Colors.error)
        setPasswordError(Colors.error)
      }
      else if (res.data.status === "alreadyVoted") {
        Toast.show({
          type: "error",
          text1: res.data.data,
          useModal: false
        })
        setError(Colors.error)
        setPasswordError(Colors.error)
      }
    } catch (err) {
      console.error(err)
      Toast.show({
        type: "error",
        text1: "Something went wrong. Try again.",
        useModal: false
      })
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ThemedView style={styles.container}>
        <Image style={styles.image} source={require("../assets/images/logo.jpg")} />
        <ThemedText style={styles.heading}>La-Jazz E-Lections</ThemedText>
        <ThemedText style={styles.subHeading}>AH YEAH YEAH</ThemedText>

        <View style={styles.card}>
          <ThemedTextInput
            maxLength={9}
            value={studNumber}
            onChangeText={onStudNumberChange}
            placeholder={"Student Number"}
            style={[styles.input, { borderColor: error }]}
            keyboardType="numeric"
          />

          <ThemedTextInput
            maxLength={3}
            value={pin}
            onChangeText={onPinChange}
            placeholder={"PIN"}
            secureTextEntry
            style={[styles.input, { borderColor: passwordError }]}
            keyboardType="numeric"
          />

          <Pressable
            onPress={handleLogin}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: pressed ? "#8B0000" : "#B22222" },
            ]}
          >
            <ThemedText style={styles.buttonText}>Login</ThemedText>
          </Pressable>
        </View>

        <ThemedText style={styles.msg}>
          Use the last <Text style={{ fontWeight: "bold" }}>3 digits</Text> of your student number as the pin.
        </ThemedText>
      </ThemedView>
    </KeyboardAvoidingView>
  )
}

export default Home

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    padding: 25,
  },
  heading: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#B22222",
    marginBottom: 5,
  },
  subHeading: {
    fontSize: 16,
    color: "#555",
    marginBottom: 25,
    fontStyle: "italic",
  },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  input: {
    marginBottom: 15,
    borderRadius: 10,
    width: "100%"
  },
  button: {
    width: "100%",
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    margin: 5,
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
    textTransform: "uppercase",
  },
  msg: {
    marginTop: 20,
    color: "#777",
    fontStyle: "italic",
    textAlign: "center",
    width: 300,
  },
  image: {
    width: 200,
    height: 150
  }
})
