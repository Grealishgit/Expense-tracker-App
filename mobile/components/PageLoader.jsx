import { View, ActivityIndicator, Text } from 'react-native'
import { styles } from "../assets/styles/home.styles"
import { COLORS } from '../constants/colors'

const PageLoader = () => {
    return (
        <View style={styles.loadingContainer} >
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={{ fontSize: 15, color: COLORS.primary }}>Loading...</Text>
        </View>
    )
}

export default PageLoader