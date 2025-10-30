import TextComponent from '@/components/ui/text-component';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function GanarScreen() {
    return (
        <View style={styles.container}>
            <TextComponent
                text="Ganar tokens"
                fontWeight="bold"
                style={styles.title}
            />
            <TextComponent
                text="Aquí puedes ver maneras de ganar tokens:"
                style={styles.subtitle}
            />

            {/* Lista de maneras de ganar tokens */}
            <View style={styles.itemContainer}>
                <TextComponent
                    text="🎯 Completa misiones diarias"
                    fontWeight="bold"
                />
                <TextComponent
                    text="Gana tokens completando tareas específicas"
                />
            </View>

            <View style={styles.itemContainer}>
                <TextComponent
                    text="🏆 Participa en eventos"
                    fontWeight="bold"
                />
                <TextComponent
                    text="Obtén recompensas por participar en eventos especiales"
                />
            </View>

            <View style={styles.itemContainer}>
                <TextComponent
                    text="👥 Invita amigos"
                    fontWeight="bold"
                />
                <TextComponent
                    text="Recibe tokens por cada amigo que se una"
                />
            </View>
        </View>
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
    itemContainer: {
        backgroundColor: '#f5f5f5',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
    },
});