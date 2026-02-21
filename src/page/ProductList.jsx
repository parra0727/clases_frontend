import { products } from '../data/products';
import ProductCard from '../components/ProductCard';
import styles from '../styles/ProductList.module.css';

const STORAGE_KEY = "products";
 
function ProductList() {

 
    return (
        <div className = {styles.container}>
            <header className = {styles.header}>
            <h1 className = {styles.title}>Lista de Productos</h1>
            <p className = {styles.description}>Explora nuestra selección de productos!</p>
            </header>
 
            <div className = {styles.grid}>
            {products.map(product => (
                <ProductCard
                key={product.id}
                name={product.name}
                category={product.category}
                stock={product.stock}
                price={product.price}
                image={product.image}
                description={product.description}
                />
            ))}
            </div>
        </div>
    )          
}
 
export default ProductList;