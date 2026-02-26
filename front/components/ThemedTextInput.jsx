import { StyleSheet, Text, TextInput, View } from 'react-native'
import React from 'react'

const ThemedTextInput = ({ style, ...props }) => {
    return (
        <TextInput style={[styles.textInput, style]} {...props} />
    )
}

export default ThemedTextInput

const styles = StyleSheet.create({
    textInput: {
        width: "100%",
        height: 50,
        borderWidth: 3,
        borderRadius: 5,
        margin: 5,
        padding: 10
    }
})