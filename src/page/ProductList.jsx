import { products } from '../data/products';
import ProductCard from '../components/ProductCard';
import styles from '../styles/ProductList.module.css';
import ProductForm from '../components/ProductForm';
import { useState } from 'react';

const STORAGE_KEY = "products";
 
function ProductList() {

    const [productsState, setProductsState] = useState(products);
    const handleAddProduct = (product) => {
        console.log("Producto recibido desde el form:", product);
    };
    
    return (
        <div className = {styles.container}>
            <header className = {styles.header}>
            <h1 className = {styles.title}>Lista de Productos</h1>
            <p className = {styles.description}>Explora nuestra selección de productos!</p>
            </header>

            <ProductForm onSubmit={handleAddProduct} />

            <div className = {styles.grid}>
            {productsState.map(product => (
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