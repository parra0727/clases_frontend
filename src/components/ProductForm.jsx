import { useEffect, useState } from "react";
import styles from "../styles/ProductForm.module.css";

const emptyValues = {
  name: "",
  category: "",
  price: "",
  stock: "",
  image: "",
  description: "",
};

function ProductForm({ initialValues, onSubmit, onCancel, isEditing = false }) {
  const [values, setValues] = useState(emptyValues);

  // useEffect: si cambia initialValues (prop), precargamos el formulario
  useEffect(() => {
    if (initialValues) {
      setValues({
        name: initialValues.name ?? "",
        category: initialValues.category ?? "",
        price: initialValues.price ?? "",
        stock: initialValues.stock ?? "",
        image: initialValues.image ?? "",
        description: initialValues.description ?? "",
      });
    } else {
      setValues(emptyValues);
    }
  }, [initialValues]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const name = values.name.trim();
    const category = values.category.trim();
    const image = values.image.trim();
    const description = values.description.trim();
    const price = Number(values.price);
    const stock = Number(values.stock);

    if (!name) return;
    if (!Number.isFinite(price) || price <= 0) return;
    if (!Number.isFinite(stock) || stock < 0) return;

    onSubmit({
      ...initialValues,
      name,
      category,
      price,
      stock,
      image,
      description,
    });

    if (!isEditing) {
      setValues(emptyValues);
    }
  };

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>
          {isEditing ? "Editar producto" : "Agregar producto"}
        </h2>
        <p className={styles.subtitle}>
          {isEditing
            ? "Modificá los campos que querés actualizar."
            : "Completá el formulario para agregar un nuevo producto."}
        </p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          <span className={styles.label}>Nombre *</span>
          <input
            className={styles.input}
            name="name"
            value={values.name}
            onChange={handleChange}
            placeholder="Ej: Teclado gamer"
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Categoría</span>
          <input
            className={styles.input}
            name="category"
            value={values.category}
            onChange={handleChange}
            placeholder="Ej: Accesorios"
          />
        </label>

        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>Precio *</span>
            <input
              className={styles.input}
              name="price"
              type="number"
              min="1"
              value={values.price}
              onChange={handleChange}
              placeholder="Ej: 199990"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Stock *</span>
            <input
              className={styles.input}
              name="stock"
              type="number"
              min="0"
              value={values.stock}
              onChange={handleChange}
              placeholder="Ej: 10"
            />
          </label>
        </div>

        <label className={styles.field}>
          <span className={styles.label}>Imagen (URL)</span>
          <input
            className={styles.input}
            name="image"
            value={values.image}
            onChange={handleChange}
            placeholder="https://..."
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Descripción</span>
          <textarea
            className={styles.textarea}
            name="description"
            value={values.description}
            onChange={handleChange}
            placeholder="Describe el producto..."
            rows={3}
          />
        </label>

        <div className={styles.actions}>
          {onCancel && (
            <button
              className={styles.btnSecondary}
              type="button"
              onClick={onCancel}
            >
              Cancelar
            </button>
          )}
          <button className={styles.btnPrimary} type="submit">
            {isEditing ? "💾 Guardar cambios" : "➕ Agregar producto"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default ProductForm;