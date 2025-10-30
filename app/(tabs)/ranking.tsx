import TextComponent from '@/components/ui/text-component';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

const rankingData = [
    { nombre: "Ana García", tokens: 2500 },
    { nombre: "Juan Pérez", tokens: 2200 },
    { nombre: "María López", tokens: 2000 },
    { nombre: "Carlos Ruiz", tokens: 1800 },
    { nombre: "Laura Torres", tokens: 1600 },
];

export default function RankingScreen() {
    return (
        <ScrollView style={styles.container}>
            <TextComponent
                text="Ranking de Usuarios"
                fontWeight="bold"
                style={styles.title}
            />
            <TextComponent
                text="Top usuarios con más tokens"
                style={styles.subtitle}
            />

            {/* Lista de ranking */}
            {rankingData.map((user, index) => (
                <View key={index} style={styles.rankingItem}>
                    <View style={styles.position}>
                        <TextComponent
                            text={`#${index + 1}`}
                            fontWeight="bold"
                            style={styles.positionText}
                        />
                    </View>
                    <View style={styles.userInfo}>
                        <TextComponent
                            text={user.nombre}
                            fontWeight="bold"
                        />
                        <TextComponent
                            text={`${user.tokens} tokens`}
                            style={styles.tokensText}
                        />
                    </View>
                </View>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
    },
    title: {
        fontSize: 24,
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 20,
        color: '#666',
    },
    rankingItem: {
        flexDirection: 'row',
        backgroundColor: '#f5f5f5',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        alignItems: 'center',
    },
    position: {
        width: 40,
        height: 40,
        backgroundColor: '#1E90FF',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    positionText: {
        color: '#fff',
        fontSize: 16,
    },
    userInfo: {
        flex: 1,
    },
    tokensText: {
        color: '#666',
        marginTop: 5,
    },
});