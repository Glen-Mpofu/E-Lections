import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { useRouter } from 'expo-router'
import ThemedText from '../components/ThemedText'
import ThemedView from '../components/ThemedView'

const Outcome = () => {
    const router = useRouter()

    return (
        <ThemedView style={styles.container}>
            <Image style={styles.image} source={require("../assets/images/logo.jpg")} />
            <ThemedText style={styles.title}>La-Jazz E-Lections</ThemedText>

            <View style={styles.card}>
                <ThemedText style={styles.heading}>We thank you for your vote!</ThemedText>
                <ThemedText style={styles.subText}>
                    Viva Comrade!
                </ThemedText>
                <ThemedText style={styles.subText}>
                    ...GodSpeed to our Candidates, hope they all do well!
                </ThemedText>
            </View>

            <TouchableOpacity
                style={styles.button}
                onPress={() => router.push('/')}
            >
                <ThemedText style={styles.buttonText}>Back to Login</ThemedText>
            </TouchableOpacity>
        </ThemedView>
    )
}

export default Outcome

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 25,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#B22222',
        marginBottom: 20,
    },
    card: {
        width: '100%',
        maxWidth: 350,
        backgroundColor: '#F9F9F9',
        borderRadius: 15,
        padding: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 5,
        alignItems: 'center',
        marginBottom: 25,
    },
    heading: {
        fontSize: 22,
        fontWeight: '600',
        color: '#222',
        textAlign: 'center',
        marginBottom: 10,
    },
    subText: {
        fontSize: 16,
        color: '#555',
        textAlign: 'center',
        marginBottom: 5,
    },
    button: {
        backgroundColor: '#B22222',
        width: 250,
        height: 50,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    buttonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
        textTransform: 'uppercase',
    },
    image: {
        width: 200,
        height: 150
    }
})
